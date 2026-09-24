'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Loader2, Building, Receipt, FileText } from 'lucide-react';

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company & Quotation Settings</h1>
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
          <span>Company settings saved! PDF quotations and calculations updated.</span>
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

        {/* Commercial Terms & Conditions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Standard Quotation Terms & Conditions (Prints on PDF)
          </h2>
          <textarea
            rows={6}
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </div>
  );
}