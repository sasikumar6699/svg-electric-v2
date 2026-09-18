'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Search, CheckCircle2, XCircle, Loader2, X, Edit, ListPlus, ChevronRight, IndianRupee, Save } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function AdminSpecificationsPage() {
  const [specs, setSpecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Spec Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<any>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [inputType, setInputType] = useState('DROPDOWN');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options Manager Modal
  const [optionsModalSpec, setOptionsModalSpec] = useState<any>(null);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState<number | ''>(0);
  const [addingOption, setAddingOption] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editOptionPrice, setEditOptionPrice] = useState<number | ''>('');
  const [editOptionLabel, setEditOptionLabel] = useState<string>('');
  const [savingOption, setSavingOption] = useState(false);

  const fetchSpecs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/specifications');
      const data = await res.json();
      setSpecs(data.specifications || []);
    } catch {
      console.error('Failed to load specifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleOpenCreate = () => {
    setEditingSpec(null);
    setCode('');
    setName('');
    setInputType('DROPDOWN');
    setUnit('');
    setDescription('');
    setDisplayOrder(specs.length + 1);
    setActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingSpec(s);
    setCode(s.code);
    setName(s.name);
    setInputType(s.inputType);
    setUnit(s.unit || '');
    setDescription(s.description || '');
    setDisplayOrder(s.displayOrder);
    setActive(s.active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = '/api/admin/specifications';
      const method = editingSpec ? 'PUT' : 'POST';
      const payload: any = {
        name,
        inputType,
        unit: unit || null,
        description: description || null,
        displayOrder,
        active,
      };

      if (editingSpec) {
        payload.id = editingSpec.id;
      } else {
        payload.code = code.trim().toUpperCase();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save specification');

      setIsModalOpen(false);
      fetchSpecs();
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionsModalSpec || !newOptionValue || !newOptionLabel) return;

    setAddingOption(true);
    try {
      const res = await fetch(`/api/admin/specifications/${optionsModalSpec.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newOptionValue.trim().toUpperCase(),
          label: newOptionLabel.trim(),
          price: Number(newOptionPrice) || 0,
          displayOrder: optionsModalSpec.options?.length || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewOptionValue('');
        setNewOptionLabel('');
        setNewOptionPrice(0);
        // Refresh options modal
        const updated = {
          ...optionsModalSpec,
          options: [...optionsModalSpec.options, data.option],
        };
        setOptionsModalSpec(updated);
        fetchSpecs();
      } else {
        alert(data.error || 'Failed to add option');
      }
    } catch {
      alert('Error adding option');
    } finally {
      setAddingOption(false);
    }
  };

  const handleUpdateOption = async (optId: string) => {
    if (!optionsModalSpec) return;
    setSavingOption(true);
    try {
      const res = await fetch(`/api/admin/specifications/${optionsModalSpec.id}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: optId,
          label: editOptionLabel.trim(),
          price: Number(editOptionPrice) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingOptionId(null);
        // Refresh local options
        const updatedOptions = optionsModalSpec.options.map((o: any) =>
          o.id === optId ? { ...o, label: data.option.label, price: data.option.price } : o
        );
        setOptionsModalSpec({ ...optionsModalSpec, options: updatedOptions });
        fetchSpecs();
      } else {
        alert(data.error || 'Failed to update option');
      }
    } catch {
      alert('Error updating option');
    } finally {
      setSavingOption(false);
    }
  };

  const filteredSpecs = specs.filter((s) => {
    if (!search) return true;
    return (
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              ADMIN MASTER
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Specification Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define dynamic engineering specifications, allowable options, units, and input controls.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Specification</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code or spec name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">{filteredSpecs.length} Specs</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Specification Name</th>
                <th className="px-4 py-3">Input Type</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3 text-center">Configured Options</th>
                <th className="px-4 py-3 text-center">Mapped Products</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    <span>Loading specifications...</span>
                  </td>
                </tr>
              ) : filteredSpecs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No specifications found.
                  </td>
                </tr>
              ) : (
                filteredSpecs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700 whitespace-nowrap">
                      {s.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      {s.description && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{s.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-medium text-slate-700">
                        {s.inputType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {s.unit || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setOptionsModalSpec(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 font-mono text-[11px] font-bold hover:bg-brand-100 transition-colors"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>{s.options.length} Options</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-600">
                      {s._count?.productSpecs || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          s.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {s.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-amber-700 transition-colors"
                        title="Edit Spec"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Spec Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingSpec ? 'Edit Specification' : 'Add New Specification'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSpec} className="p-6 space-y-3.5 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specification Code *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingSpec}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STARTER_TYPE"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specification Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starter / Control Type"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Input UI Type *</label>
                  <select
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 font-mono text-xs"
                  >
                    <option value="DROPDOWN">DROPDOWN</option>
                    <option value="SEARCHABLE_DROPDOWN">SEARCHABLE_DROPDOWN</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="TEXT">TEXT</option>
                    <option value="BOOLEAN">BOOLEAN (Yes/No)</option>
                    <option value="MULTI_SELECT">MULTI_SELECT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (Optional)</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. A, V, kW, HP"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about this parameter..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="specActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="specActive" className="text-slate-700 font-medium">
                  Active (Usable across catalog and estimations)
                </label>
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
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSpec ? 'Update Spec' : 'Create Spec'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Options Drawer Modal */}
      {optionsModalSpec && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-700 font-bold uppercase block">
                  OPTIONS MANAGER
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {optionsModalSpec.name} ({optionsModalSpec.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOptionsModalSpec(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Existing Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-700 font-mono text-[11px] uppercase">
                    Configured Option Prices ({optionsModalSpec.options?.length || 0})
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Additive Pricing Rule (+₹)
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {optionsModalSpec.options?.map((opt: any) => {
                    const isEditing = editingOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 transition-all hover:border-slate-300"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Display Label
                                </label>
                                <input
                                  type="text"
                                  value={editOptionLabel}
                                  onChange={(e) => setEditOptionLabel(e.target.value)}
                                  className="w-full px-2 py-1 text-xs rounded border border-slate-300"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                  Add-on Price (+₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={editOptionPrice}
                                  onChange={(e) => setEditOptionPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-mono font-bold text-slate-900"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingOptionId(null)}
                                className="px-2.5 py-1 text-[11px] rounded border border-slate-300 text-slate-600 hover:bg-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingOption}
                                onClick={() => handleUpdateOption(opt.id)}
                                className="px-3 py-1 text-[11px] rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1 disabled:opacity-50"
                              >
                                {savingOption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                <span>Save Price</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{opt.label}</span>
                                <span className="font-mono text-slate-400 text-[10px]">[{opt.value}]</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                +₹{(opt.price || 0).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingOptionId(opt.id);
                                  setEditOptionLabel(opt.label);
                                  setEditOptionPrice(opt.price || 0);
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-amber-700 transition-colors"
                                title="Edit Price / Label"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Option Form */}
              <form onSubmit={handleAddOption} className="pt-4 border-t border-slate-200 space-y-3">
                <p className="font-bold text-slate-700 font-mono text-[11px] uppercase">
                  + Add Option Choice with Additive Price
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Internal Key / Value *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1000A"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Display Label *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1000 Amps"
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Add-on Price (+₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={newOptionPrice}
                        onChange={(e) => setNewOptionPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-6 pr-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingOption || !newOptionValue || !newOptionLabel}
                    className="px-4 py-1.5 rounded bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {addingOption && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Add Option</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}