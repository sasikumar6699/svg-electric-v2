'use client';

import React, { useMemo } from 'react';
import { X, Check, ArrowRight, SlidersHorizontal, ShieldCheck, Zap } from 'lucide-react';

interface VariantOption {
  id: string;
  optionName: string;
  isDefault: boolean;
  priceDelta: number;
  description: string | null;
}

interface VariantDimension {
  id: string;
  dimensionName: string;
  displayOrder: number;
  options: VariantOption[];
}

interface FinishedGood {
  id: string;
  modelNumber: string;
  name: string;
  finalExWorksPrice: number;
  variants: VariantDimension[];
}

interface BrandComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: FinishedGood | null;
  selectedOptions: Record<string, string>;
  onApplyOptions: (newOptions: Record<string, string>) => void;
}

const COMMON_MAKES = ['Schneider Electric', 'ABB', 'L&T', 'Siemens', 'Legrand'];

export const BrandComparisonModal: React.FC<BrandComparisonModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  selectedOptions,
  onApplyOptions,
}) => {
  if (!isOpen || !currentModel) return null;

  // Extract all distinct brands/makes available across variant options
  const comparisonData = useMemo(() => {
    const baseExWorks = currentModel.finalExWorksPrice || 0;

    // Detect which makes are available in options
    const foundMakes = new Set<string>();
    currentModel.variants.forEach((dim) => {
      dim.options.forEach((opt) => {
        COMMON_MAKES.forEach((mk) => {
          if (opt.optionName.toLowerCase().includes(mk.toLowerCase())) {
            foundMakes.add(mk);
          }
        });
      });
    });

    const makesToList = foundMakes.size > 0 ? Array.from(foundMakes) : ['Schneider Electric', 'ABB', 'L&T'];

    return makesToList.map((brand) => {
      let brandDelta = 0;
      const matchedOptions: Record<string, string> = {};
      const specifications: { dimension: string; optionName: string; delta: number }[] = [];

      currentModel.variants.forEach((dim) => {
        // Try to find an option containing the brand name
        const brandOpt = dim.options.find((opt) =>
          opt.optionName.toLowerCase().includes(brand.toLowerCase())
        );

        if (brandOpt) {
          brandDelta += brandOpt.priceDelta;
          matchedOptions[dim.id] = brandOpt.id;
          specifications.push({
            dimension: dim.dimensionName,
            optionName: brandOpt.optionName,
            delta: brandOpt.priceDelta,
          });
        } else {
          // Fall back to default or currently selected option
          const fallbackOpt = dim.options.find((o) => o.isDefault) || dim.options[0];
          if (fallbackOpt) {
            brandDelta += fallbackOpt.priceDelta;
            matchedOptions[dim.id] = fallbackOpt.id;
            specifications.push({
              dimension: dim.dimensionName,
              optionName: `${fallbackOpt.optionName} (Std)`,
              delta: fallbackOpt.priceDelta,
            });
          }
        }
      });

      const netExWorks = Math.max(0, baseExWorks + brandDelta);
      const gst18 = Math.round(netExWorks * 0.18);
      const grossTotal = netExWorks + gst18;

      // Check if this brand's options match the currently active selection
      const isCurrentlySelected = Object.entries(matchedOptions).every(
        ([dimId, optId]) => selectedOptions[dimId] === optId
      );

      return {
        brand,
        delta: brandDelta,
        netExWorks,
        gst18,
        grossTotal,
        optionsMap: matchedOptions,
        specifications,
        isCurrentlySelected,
      };
    });
  }, [currentModel, selectedOptions]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Tier-1 Switchgear Benchmark
                </span>
                <span className="text-xs font-mono text-slate-400">Model: {currentModel.modelNumber}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Tier-1 Switchgear OEM Comparison Matrix
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Comparison Cards */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            Compare real-time commercial pricing, Net Ex-Works, and GST impacts across leading switchgear OEMs for{' '}
            <strong className="text-slate-800">{currentModel.name}</strong>. Click &quot;Apply This Make&quot; to configure all related components in one click.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((item) => (
              <div
                key={item.brand}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                  item.isCurrentlySelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                {item.isCurrentlySelected && (
                  <span className="absolute -top-2.5 right-4 bg-blue-600 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                    CURRENT SELECTION
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h3 className="font-bold text-sm text-slate-900">{item.brand}</h3>
                    <span className="text-[10px] font-mono text-slate-400">Industrial Grade</span>
                  </div>

                  {/* Commercial Figures */}
                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Variant Delta:</span>
                      <strong
                        className={
                          item.delta > 0
                            ? 'text-amber-700'
                            : item.delta < 0
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }
                      >
                        {item.delta === 0 ? '₹0 (Standard)' : `${item.delta > 0 ? '+' : ''}₹${item.delta.toLocaleString('en-IN')}`}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 text-xs font-bold pt-1 border-t border-slate-200">
                      <span>Net Ex-Works:</span>
                      <span className="text-slate-900">₹{item.netExWorks.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>GST (18%):</span>
                      <span>₹{item.gst18.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-blue-900 text-xs font-black pt-1 border-t border-slate-200">
                      <span>Total Estimation:</span>
                      <span className="text-blue-600 text-sm">₹{item.grossTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Specification Breakdown List */}
                  <div className="space-y-1.5 text-[11px]">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Configured Subsystems:
                    </span>
                    {item.specifications.slice(0, 4).map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-start justify-between gap-2 text-slate-600">
                        <span className="text-slate-500 truncate max-w-[120px]">{spec.dimension}:</span>
                        <span className="font-semibold text-slate-800 text-right truncate max-w-[130px]">
                          {spec.optionName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {item.isCurrentlySelected ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Active in Estimation</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyOptions(item.optionsMap);
                        onClose();
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
                    >
                      <span>Apply {item.brand} Make</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            All listed OEMs comply with IEC 61439-1 / 2 standards.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
