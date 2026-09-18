'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface QuotationMetaFormProps {
  date: string;
  setDate: (v: string) => void;
  referenceNumber: string;
  setReferenceNumber: (v: string) => void;
  validityDays: number;
  setValidityDays: (v: number) => void;
  remarks: string;
  setRemarks: (v: string) => void;
}

export const QuotationMetaForm: React.FC<QuotationMetaFormProps> = ({
  date,
  setDate,
  referenceNumber,
  setReferenceNumber,
  validityDays,
  setValidityDays,
  remarks,
  setRemarks,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-brand-600" />
        <span>Quotation Meta</span>
      </h2>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Estimation Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Customer RFQ / Reference #</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. RFQ/2026/EL-99"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
          <input
            type="number"
            min={1}
            value={validityDays}
            onChange={(e) => setValidityDays(Number(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Quotation Remarks</label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Standard powder coating RAL 7035 with Siemens switchgear."
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};