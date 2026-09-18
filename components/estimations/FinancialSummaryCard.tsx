'use client';

import React from 'react';
import { formatINR, numberToIndianWords } from '@/lib/utils';
import { Wrench, Truck, Percent, IndianRupee, ShieldCheck } from 'lucide-react';

interface FinancialSummaryCardProps {
  subtotal: number;
  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  discountAmount: number;

  // Installation Charges
  installationType: 'PERCENTAGE' | 'FIXED' | 'NONE';
  setInstallationType: (v: 'PERCENTAGE' | 'FIXED' | 'NONE') => void;
  installationRate: number;
  setInstallationRate: (v: number) => void;
  installationAmount: number;
  setInstallationAmount: (v: number) => void;

  // Freight Charges
  freightType: 'PERCENTAGE' | 'FIXED' | 'NONE';
  setFreightType: (v: 'PERCENTAGE' | 'FIXED' | 'NONE') => void;
  freightRate: number;
  setFreightRate: (v: number) => void;
  freightAmount: number;
  setFreightAmount: (v: number) => void;

  // Taxes and Grand Total
  taxableAmount: number;
  taxType: 'INTRA_STATE' | 'INTER_STATE';
  setTaxType: (v: 'INTRA_STATE' | 'INTER_STATE') => void;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  grandTotal: number;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  subtotal,
  discountPercent,
  setDiscountPercent,
  discountAmount,

  installationType,
  setInstallationType,
  installationRate,
  setInstallationRate,
  installationAmount,
  setInstallationAmount,

  freightType,
  setFreightType,
  freightRate,
  setFreightRate,
  freightAmount,
  setFreightAmount,

  taxableAmount,
  taxType,
  setTaxType,
  cgstRate,
  cgstAmount,
  sgstRate,
  sgstAmount,
  igstRate,
  igstAmount,
  grandTotal,
}) => {
  const words = numberToIndianWords(grandTotal);

  return (
    <div className="space-y-6">
      {/* Dual Charges Config: Installation & Commissioning + Freight & Transportation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Installation & Commissioning Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-600" />
              <span>Installation & Commissioning</span>
            </h3>
            <span className="font-mono font-bold text-slate-800">
              {formatINR(installationAmount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setInstallationType('PERCENTAGE')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1 ${
                installationType === 'PERCENTAGE'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setInstallationType('FIXED')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1 ${
                installationType === 'FIXED'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              <span>Manual Entry (₹)</span>
            </button>

            <button
              type="button"
              onClick={() => setInstallationType('NONE')}
              className={`py-1.5 px-3 rounded-md font-medium text-center transition-all ${
                installationType === 'NONE'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              None
            </button>
          </div>

          {installationType === 'PERCENTAGE' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 font-medium">Installation Rate (% of net total):</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={installationRate}
                    onChange={(e) => setInstallationRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 rounded border border-slate-300 font-mono text-right font-semibold bg-white"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Calculated automatically as {installationRate}% of net product value.
              </p>
            </div>
          )}

          {installationType === 'FIXED' && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-amber-900 font-medium">Manual Fixed Amount (₹):</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={installationAmount}
                    onChange={(e) => setInstallationAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Enter fixed cost"
                    className="w-32 px-2 py-1 rounded border border-amber-300 font-mono text-right font-semibold bg-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-amber-800">
                Lump sum installation & commissioning charge entered manually.
              </p>
            </div>
          )}

          {installationType === 'NONE' && (
            <p className="text-[11px] text-slate-400 italic py-1">
              Installation & commissioning charges are excluded (₹0.00).
            </p>
          )}
        </div>

        {/* Freight & Transportation Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>Freight & Transportation</span>
            </h3>
            <span className="font-mono font-bold text-slate-800">
              {formatINR(freightAmount)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFreightType('PERCENTAGE')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1 ${
                freightType === 'PERCENTAGE'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>Percentage (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setFreightType('FIXED')}
              className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1 ${
                freightType === 'FIXED'
                  ? 'bg-white text-brand-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              <span>Manual Entry (₹)</span>
            </button>

            <button
              type="button"
              onClick={() => setFreightType('NONE')}
              className={`py-1.5 px-3 rounded-md font-medium text-center transition-all ${
                freightType === 'NONE'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              None
            </button>
          </div>

          {freightType === 'PERCENTAGE' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-600 font-medium">Freight Rate (% of net total):</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={freightRate}
                    onChange={(e) => setFreightRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 rounded border border-slate-300 font-mono text-right font-semibold bg-white"
                  />
                  <span className="text-slate-500 font-mono">%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Calculated automatically as {freightRate}% of net product value.
              </p>
            </div>
          )}

          {freightType === 'FIXED' && (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-amber-900 font-medium">Manual Fixed Freight (₹):</label>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Enter fixed freight"
                    className="w-32 px-2 py-1 rounded border border-amber-300 font-mono text-right font-semibold bg-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-amber-800">
                Fixed transportation & transit insurance charge entered manually.
              </p>
            </div>
          )}

          {freightType === 'NONE' && (
            <p className="text-[11px] text-slate-400 italic py-1">
              Freight charges are excluded / ex-works (₹0.00).
            </p>
          )}
        </div>
      </div>

      {/* Grid: GST Category & Final Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Words & GST Supply Type */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Amount In Words & GST Category</span>
          </h2>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1 font-mono uppercase text-[10px]">
              Rupees In Words:
            </span>
            <p className="font-medium text-brand-900 leading-relaxed">{words}</p>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-slate-700">GST Supply Type:</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taxType"
                  value="INTRA_STATE"
                  checked={taxType === 'INTRA_STATE'}
                  onChange={() => setTaxType('INTRA_STATE')}
                  className="text-brand-600"
                />
                <span>Intra-State (CGST 9% + SGST 9%) - Within Tamil Nadu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taxType"
                  value="INTER_STATE"
                  checked={taxType === 'INTER_STATE'}
                  onChange={() => setTaxType('INTER_STATE')}
                  className="text-brand-600"
                />
                <span>Inter-State (IGST 18%) - Outside Tamil Nadu</span>
              </label>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
          <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Estimation Financial Summary
          </h2>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal (Line Items Total):</span>
            <span className="font-mono font-semibold">{formatINR(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between py-1 text-slate-600">
            <div className="flex items-center gap-2">
              <span>Commercial Discount (%):</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 px-2 py-0.5 rounded border border-slate-300 font-mono text-right"
              />
            </div>
            <span className="font-mono text-rose-600">- {formatINR(discountAmount)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Installation & Commissioning:</span>
            <span className="font-mono font-medium text-slate-800">+ {formatINR(installationAmount)}</span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Freight & Transportation:</span>
            <span className="font-mono font-medium text-slate-800">+ {formatINR(freightAmount)}</span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-800 font-semibold border-t border-slate-200">
            <span>Taxable Assessable Value:</span>
            <span className="font-mono text-slate-900 font-bold">{formatINR(taxableAmount)}</span>
          </div>

          {taxType === 'INTRA_STATE' ? (
            <>
              <div className="flex justify-between py-1 text-slate-500">
                <span>CGST ({cgstRate}%):</span>
                <span className="font-mono">{formatINR(cgstAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500">
                <span>SGST ({sgstRate}%):</span>
                <span className="font-mono">{formatINR(sgstAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 text-slate-500">
              <span>IGST ({igstRate}%):</span>
              <span className="font-mono">{formatINR(igstAmount)}</span>
            </div>
          )}

          <div className="flex justify-between p-3 rounded-lg bg-slate-900 text-white font-bold text-sm items-center mt-2 shadow-xs">
            <span>ESTIMATED GRAND TOTAL:</span>
            <span className="font-mono text-base text-brand-300">{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};