'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Loader2,
  Building,
  Receipt,
  FileText,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  FileSpreadsheet,
  Lock,
  Download,
  X,
  Archive,
  AlertCircle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [gstin, setGstin] = useState('');
  const [defaultGSTRate, setDefaultGSTRate] = useState(18);
  const [defaultCGSTRate, setDefaultCGSTRate] = useState(9);
  const [defaultSGSTRate, setDefaultSGSTRate] = useState(9);
  const [defaultIGSTRate, setDefaultIGSTRate] = useState(18);
  const [estimationPrefix, setEstimationPrefix] = useState('EST-');
  const [yearBasedNumbering, setYearBasedNumbering] = useState(true);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  // Data Deletion & Auto-Backup State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteScope, setDeleteScope] = useState<'ALL' | 'PRODUCTS' | 'PRICE_MASTER' | 'ESTIMATIONS'>('ALL');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<{ message: string; filename: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          setSettings(s);
          setCompanyName(s.companyName);
          setTagline(s.tagline || '');
          setAddress(s.address);
          setPhone(s.phone);
          setEmail(s.email);
          setWebsite(s.website);
          setGstin(s.gstin);
          setDefaultGSTRate(s.defaultGSTRate);
          setDefaultCGSTRate(s.defaultCGSTRate);
          setDefaultSGSTRate(s.defaultSGSTRate);
          setDefaultIGSTRate(s.defaultIGSTRate);
          setEstimationPrefix(s.estimationPrefix);
          setYearBasedNumbering(s.yearBasedNumbering);
          setTermsAndConditions(s.termsAndConditions || '');
          setBankDetails(s.bankDetails || '');
        }
      } catch {
        console.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          tagline,
          address,
          phone,
          email,
          website,
          gstin,
          defaultGSTRate,
          defaultCGSTRate,
          defaultSGSTRate,
          defaultIGSTRate,
          estimationPrefix,
          yearBasedNumbering,
          termsAndConditions,
          bankDetails,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
      } else {
        alert('Failed to save settings');
      }
    } catch {
      alert('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmPhrase !== 'DELETE-DATA') {
      setDeleteError('Please type "DELETE-DATA" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Administrator password is required for security verification.');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      const res = await fetch('/api/admin/system/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirmPhrase: deleteConfirmPhrase,
          scope: deleteScope,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errData.error || 'Failed to authenticate or execute delete');
      }

      // Automatically trigger file download of the returned ZIP archive!
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const downloadFilename = filenameMatch ? filenameMatch[1] : `SVG_Electric_Backup_${Date.now()}.zip`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDeleteSuccess({
        message: `System data successfully deleted! Re-importable Excel backup archive "${downloadFilename}" has been downloaded.`,
        filename: downloadFilename,
      });
      setDeletePassword('');
      setDeleteConfirmPhrase('');
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred during deletion.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-mono">Loading System Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              ADMIN MASTER
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company & Estimation Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SVG Electric business identity, GST tax percentages, estimation numbering, and PDF terms.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Settings</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Company settings saved! PDF estimations and calculations updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Company Profile (Appears on PDF Header)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Business Subtitle</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Registered Works / Office Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone(s) *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Sales Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL *</label>
              <input
                type="text"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company GSTIN *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tax & Estimation Numbering */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Rates */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Goods & Services Tax (GST) Rates</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={defaultGSTRate}
                  onChange={(e) => setDefaultGSTRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CGST Rate (%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={defaultCGSTRate}
                  onChange={(e) => setDefaultCGSTRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SGST Rate (%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={defaultSGSTRate}
                  onChange={(e) => setDefaultSGSTRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IGST Rate (%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={defaultIGSTRate}
                  onChange={(e) => setDefaultIGSTRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Estimation Numbering Sequence */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Estimation Numbering Sequence</span>
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimation Prefix</label>
              <input
                type="text"
                value={estimationPrefix}
                onChange={(e) => setEstimationPrefix(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Example output: {estimationPrefix}2026-01002
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="yearSeq"
                checked={yearBasedNumbering}
                onChange={(e) => setYearBasedNumbering(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="yearSeq" className="text-slate-700 font-medium">
                Include Current Year in Estimation Number (e.g. EST-2026-XXXXX)
              </label>
            </div>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* DANGER ZONE: DATA MANAGEMENT, BACKUP & SYSTEM DELETION                    */}
      {/* ========================================================================= */}
      <div className="bg-rose-50/40 rounded-2xl border-2 border-rose-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>ADMINISTRATOR RESTRICTED &bull; DANGER ZONE</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              System Data Deletion & Automatic Re-Importable Excel Backup
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Permanently delete finished goods, BOMs, or price master catalogs. For total safety, an exact-template Excel ZIP archive is automatically generated and downloaded to your computer <strong>before</strong> any data is wiped.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteSuccess(null);
              setDeletePassword('');
              setDeleteConfirmPhrase('');
              setShowDeleteModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95 whitespace-nowrap self-start sm:self-center"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete / Reset System Data...</span>
          </button>
        </div>

        {/* Informational safeguards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-rose-200/80 text-xs">
          <div className="bg-white p-3 rounded-xl border border-rose-100 flex items-start gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block text-[11px]">100% Re-Importable Excel Backup</strong>
              <span className="text-[10px] text-slate-500">Auto-downloads zip containing Price Master & BOM templates ready for re-import.</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-100 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block text-[11px]">Mandatory Password Authentication</strong>
              <span className="text-[10px] text-slate-500">Requires your current administrator password and typing "DELETE-DATA" to confirm.</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-rose-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block text-[11px]">Core Admin Account Protection</strong>
              <span className="text-[10px] text-slate-500">Admin login credentials, company settings, and audit logs are permanently preserved.</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECURITY MODAL: DATA DELETION WITH PASSWORD AUTHENTICATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-rose-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header - Fixed */}
            <div className="bg-rose-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Danger Zone: Data Deletion & Auto-Backup</h3>
                  <span className="text-[10px] text-rose-200 font-mono">Authentication & Snapshot Confirmation</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-rose-300 hover:text-white p-1 rounded-lg"
                disabled={deleting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable inside max-h-[90vh] */}
            <form onSubmit={handleDelete} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                {deleteError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">{deleteError}</span>
                  </div>
                )}

                {deleteSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-emerald-950">Deletion Completed & Backup Downloaded!</h4>
                        <p className="text-xs text-emerald-800 mt-0.5">{deleteSuccess.message}</p>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 font-mono text-[11px] text-emerald-900 flex items-center justify-between">
                      <span className="truncate">{deleteSuccess.filename}</span>
                      <span className="text-emerald-700 font-bold shrink-0">Ready for Re-Import</span>
                    </div>
                  </div>
                )}

                {/* 1. Scope Selection */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase font-mono text-[11px]">
                    Step 1: Select Deletion Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteScope('ALL')}
                      disabled={deleting}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deleteScope === 'ALL'
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="block text-xs font-bold">Complete Factory Reset</strong>
                      <span className="text-[10px] opacity-75">Wipes Products, BOMs, Estimations, & Price Master</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteScope('PRODUCTS')}
                      disabled={deleting}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deleteScope === 'PRODUCTS'
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="block text-xs font-bold">Products & BOMs Only</strong>
                      <span className="text-[10px] opacity-75">Keeps Central Price Master intact</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteScope('PRICE_MASTER')}
                      disabled={deleting}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deleteScope === 'PRICE_MASTER'
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="block text-xs font-bold">Price Master Only</strong>
                      <span className="text-[10px] opacity-75">Clears raw materials & bought-out items</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteScope('ESTIMATIONS')}
                      disabled={deleting}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deleteScope === 'ESTIMATIONS'
                          ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <strong className="block text-xs font-bold">Estimations Only</strong>
                      <span className="text-[10px] opacity-75">Clears customer quotes & revisions</span>
                    </button>
                  </div>
                </div>

                {/* Scope description banner */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>What happens next:</strong> The server compiles all current records into re-importable Excel workbooks matching the official template headers (e.g. <code>01_Price_Master_Import_Template.xlsx</code>, <code>BOM_Upload_Templates_Per_Model/</code>). The ZIP archive triggers an automatic download, and the selected database tables are cleared atomically.
                </div>

                {/* 2. Admin Password Input */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Step 2: Enter Administrator Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your current admin account password"
                      disabled={deleting}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Verified against encrypted database hash before any action is permitted.
                  </span>
                </div>

                {/* 3. Safety Phrase Confirmation Input */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Step 3: Type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE-DATA</span> to confirm
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmPhrase}
                    onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                    placeholder="DELETE-DATA"
                    disabled={deleting}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  />
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deleting || deleteConfirmPhrase !== 'DELETE-DATA' || !deletePassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Backing Up & Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Auto-Backup ZIP & Delete Data</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}