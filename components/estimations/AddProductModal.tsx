'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils';
import { X, AlertCircle, Loader2, Sparkles, Edit3, CheckCircle2, ChevronDown } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  allProducts: any[];
  onAddProduct: (item: any) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  allProducts,
  onAddProduct,
}) => {
  const [modalCategoryId, setModalCategoryId] = useState('');
  const [modalProductId, setModalProductId] = useState('');
  const [modalSelectedSpecs, setModalSelectedSpecs] = useState<Record<string, any>>({});
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPriceResult, setModalPriceResult] = useState<any>(null);
  const [modalCalculating, setModalCalculating] = useState(false);
  const [modalPriceError, setModalPriceError] = useState<string | null>(null);

  // Manual Price Override state
  const [enableManualPrice, setEnableManualPrice] = useState(false);
  const [manualUnitPrice, setManualUnitPrice] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setModalCategoryId('');
      setModalProductId('');
      setModalSelectedSpecs({});
      setModalQuantity(1);
      setModalPriceResult(null);
      setModalPriceError(null);
      setEnableManualPrice(false);
      setManualUnitPrice('');
    }
  }, [isOpen]);

  const filteredProducts = allProducts.filter((p) => {
    if (!modalCategoryId) return true;
    return p.categoryId === modalCategoryId;
  });

  const currentSelectedProduct = allProducts.find((p) => p.id === modalProductId);

  // Dynamic price calculation
  useEffect(() => {
    if (!modalProductId) {
      setModalPriceResult(null);
      setModalPriceError(null);
      return;
    }

    const prod = allProducts.find((p) => p.id === modalProductId);
    if (!prod) return;

    let missingRequired = false;
    for (const ps of prod.productSpecs || []) {
      if (ps.isRequired) {
        const val = modalSelectedSpecs[ps.specification.code];
        if (val === undefined || val === null || val === '') {
          missingRequired = true;
          break;
        }
      }
    }

    if (missingRequired) {
      setModalPriceResult(null);
      setModalPriceError('Please select all required specifications.');
      return;
    }

    async function calculate() {
      setModalCalculating(true);
      setModalPriceError(null);
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: modalProductId,
            specifications: modalSelectedSpecs,
            quantity: modalQuantity,
            manualPriceOverride:
              enableManualPrice && manualUnitPrice !== '' && !isNaN(Number(manualUnitPrice))
                ? Number(manualUnitPrice)
                : null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setModalPriceResult(data);
          setModalPriceError(null);
        } else {
          setModalPriceResult(null);
          setModalPriceError(data.error || 'Price configuration not available for this combination.');
        }
      } catch {
        setModalPriceError('Failed to calculate price.');
      } finally {
        setModalCalculating(false);
      }
    }

    calculate();
  }, [modalProductId, modalSelectedSpecs, modalQuantity, allProducts, enableManualPrice, manualUnitPrice]);

  const handleConfirmAdd = () => {
    if (!currentSelectedProduct || !modalPriceResult) return;

    const detailedSpecs: any[] = [];
    for (const ps of currentSelectedProduct.productSpecs || []) {
      const code = ps.specification.code;
      const val = modalSelectedSpecs[code];
      if (val !== undefined && val !== null && val !== '') {
        const opt = ps.specification.options?.find(
          (o: any) => String(o.value).trim().toUpperCase() === String(val).trim().toUpperCase()
        );
        detailedSpecs.push({
          code,
          name: ps.specification.name,
          value: String(val),
          label: opt ? opt.label : String(val),
          price: opt ? opt.price : 0,
        });
      }
    }

    const item = {
      productId: currentSelectedProduct.id,
      productCode: currentSelectedProduct.productCode,
      productName: currentSelectedProduct.name,
      category: currentSelectedProduct.category?.name || 'General',
      specifications: modalSelectedSpecs,
      detailedSpecs,
      quantity: modalQuantity,
      unitPrice: modalPriceResult.unitPrice,
      lineTotal: modalPriceResult.lineAmount,
      priceRuleId: modalPriceResult.priceRuleId || null,
      isManualPrice: modalPriceResult.isManualPrice || false,
      breakdown: modalPriceResult.breakdown,
    };

    onAddProduct(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Add Product & Configure Specifications</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Additive Pricing
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select product and component specifications. Prices are automatically calculated per specification.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Category & Product Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1. Product Category</label>
              <select
                value={modalCategoryId}
                onChange={(e) => {
                  setModalCategoryId(e.target.value);
                  setModalProductId('');
                  setModalSelectedSpecs({});
                  setModalPriceResult(null);
                  setEnableManualPrice(false);
                  setManualUnitPrice('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- All Categories --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">2. Select Product *</label>
              <select
                value={modalProductId}
                onChange={(e) => {
                  setModalProductId(e.target.value);
                  setModalSelectedSpecs({});
                  setModalPriceResult(null);
                  setEnableManualPrice(false);
                  setManualUnitPrice('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 font-medium bg-white"
              >
                <option value="">-- Select Product --</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} - {p.name} {p.basePrice > 0 ? `(Base: ${formatINR(p.basePrice)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DYNAMIC SPECIFICATIONS */}
          {currentSelectedProduct && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 font-mono uppercase text-[11px] tracking-wide">
                    Specifications & Individual Component Pricing ({currentSelectedProduct.productSpecs?.length || 0})
                  </span>
                  {currentSelectedProduct.basePrice > 0 && (
                    <p className="text-[11px] text-brand-700 font-medium mt-0.5">
                      Base Panel Enclosure Price: <strong>{formatINR(currentSelectedProduct.basePrice)}</strong>
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {currentSelectedProduct.productCode}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentSelectedProduct.productSpecs?.map((ps: any) => {
                  const spec = ps.specification;
                  const val = modalSelectedSpecs[spec.code] || '';

                  return (
                    <div key={spec.code} className="space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block font-semibold text-slate-700 text-[11px]">
                          {spec.name} {ps.isRequired && <span className="text-rose-500">*</span>}
                          {spec.unit && <span className="text-slate-400 font-normal"> ({spec.unit})</span>}
                        </label>
                      </div>

                      {spec.inputType === 'DROPDOWN' || spec.inputType === 'SEARCHABLE_DROPDOWN' ? (
                        <select
                          value={val}
                          onChange={(e) =>
                            setModalSelectedSpecs({
                              ...modalSelectedSpecs,
                              [spec.code]: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                        >
                          <option value="">-- Select {spec.name} --</option>
                          {spec.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} {opt.price > 0 ? `(+${formatINR(opt.price)})` : opt.price === 0 ? '(Included / ₹0)' : ''}
                            </option>
                          ))}
                        </select>
                      ) : spec.inputType === 'BOOLEAN' ? (
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setModalSelectedSpecs({
                                ...modalSelectedSpecs,
                                [spec.code]: 'YES',
                              })
                            }
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                              val === 'YES'
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModalSelectedSpecs({
                                ...modalSelectedSpecs,
                                [spec.code]: 'NO',
                              })
                            }
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                              val === 'NO'
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <input
                          type={spec.inputType === 'NUMBER' ? 'number' : 'text'}
                          value={val}
                          onChange={(e) =>
                            setModalSelectedSpecs({
                              ...modalSelectedSpecs,
                              [spec.code]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${spec.name}`}
                          className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:ring-1 focus:ring-brand-500 bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quantity & Manual Price Override Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={modalQuantity}
                      onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-sm font-semibold"
                    />
                    <span className="text-slate-500 text-xs">Units / Nos</span>
                  </div>
                </div>

                {/* Manual Price Override Toggle */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableManualPrice}
                        onChange={(e) => {
                          setEnableManualPrice(e.target.checked);
                          if (e.target.checked && modalPriceResult?.unitPrice && !manualUnitPrice) {
                            setManualUnitPrice(String(modalPriceResult.breakdown?.calculatedUnitPrice || modalPriceResult.unitPrice));
                          }
                        }}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                        Manual Price Override
                      </span>
                    </label>
                  </div>

                  {enableManualPrice ? (
                    <div className="space-y-1 mt-2">
                      <label className="block text-[11px] text-slate-500 font-medium">Custom Unit Price (₹):</label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={manualUnitPrice}
                        onChange={(e) => setManualUnitPrice(e.target.value)}
                        placeholder="Enter negotiated unit price"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-slate-900 font-mono text-xs font-semibold focus:ring-2 focus:ring-amber-400"
                      />
                      <p className="text-[10px] text-amber-700 italic">
                        Manual price overrides the additive specification calculation for this item.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">
                      Using automatic sum of base price + selected individual specification options.
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time Pricing Result & Specification Breakdown Box */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                {modalCalculating ? (
                  <div className="p-5 flex items-center justify-center gap-2 text-brand-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium text-xs">Aggregating Specification Prices...</span>
                  </div>
                ) : modalPriceResult ? (
                  <div className="p-4 space-y-3">
                    {/* Additive Breakdown List */}
                    <div className="border-b border-slate-200 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Individual Specification Cost Breakdown
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Strategy: {modalPriceResult.pricingStrategy}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between py-0.5 text-slate-600">
                          <span>Product Base Enclosure:</span>
                          <span className="font-mono font-medium">
                            {formatINR(modalPriceResult.breakdown?.productBasePrice || 0)}
                          </span>
                        </div>

                        {modalPriceResult.breakdown?.optionsBreakdown?.map((item: any) => (
                          <div key={item.specCode} className="flex justify-between py-0.5 text-slate-600">
                            <span>
                              {item.specName}: <strong className="text-slate-800 font-semibold">{item.optionLabel}</strong>
                            </span>
                            <span className="font-mono font-medium text-slate-800">
                              + {formatINR(item.price)}
                            </span>
                          </div>
                        ))}

                        <div className="flex justify-between py-1 border-t border-slate-200 text-slate-700 font-semibold mt-1">
                          <span>Total Additive Calculated Unit Cost:</span>
                          <span className="font-mono text-slate-900">
                            {formatINR(modalPriceResult.breakdown?.calculatedUnitPrice || modalPriceResult.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Final Unit Price and Line Total */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          {enableManualPrice ? 'Active Manual Unit Price:' : 'Unit Estimated Price:'}
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatINR(modalPriceResult.unitPrice)}
                          </span>
                          {enableManualPrice && (
                            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              Manual Override
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                        <span className="font-bold text-slate-900">
                          Total Line Amount ({modalQuantity} Qty):
                        </span>
                        <span className="font-mono font-bold text-emerald-600 text-base">
                          {formatINR(modalPriceResult.lineAmount)}
                        </span>
                      </div>

                      {modalPriceResult.notes && (
                        <p className="text-[10px] text-slate-500 font-mono italic">
                          Rule Note: {modalPriceResult.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-amber-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{modalPriceError || 'Select all required specifications to calculate individual prices.'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!modalPriceResult || modalCalculating}
            onClick={handleConfirmAdd}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Add to Estimation</span>
          </button>
        </div>
      </div>
    </div>
  );
};