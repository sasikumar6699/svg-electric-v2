'use client';

import React, { useState } from 'react';
import { Printer, X, Eye, EyeOff, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';

interface ProductPrintModalProps {
  product: {
    id: string;
    productCode: string;
    name: string;
    price: number;
    description?: string | null;
    specifications?: Array<{ name: string; value: string }> | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    category?: { name: string } | null;
    updatedAt?: string | Date;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductPrintModal: React.FC<ProductPrintModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [includePrice, setIncludePrice] = useState(true);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const specs = Array.isArray(product.specifications) ? product.specifications : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Product Specification Sheet & Print
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {product.productCode} • {product.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Price Toggle */}
            <label className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-xs">
              <input
                type="checkbox"
                checked={includePrice}
                onChange={(e) => setIncludePrice(e.target.checked)}
                className="rounded border-slate-600 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-slate-200 select-none">
                {includePrice ? 'Price: Included' : 'Price: Hidden (Technical Only)'}
              </span>
            </label>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 flex justify-center">
          <div
            id="printable-product-sheet"
            className="bg-white border border-slate-200 shadow-lg p-8 sm:p-10 w-full max-w-[210mm] min-h-[297mm] text-slate-800 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0"
          >
            {/* Top Brand Accent Bar */}
            <div className="h-2 bg-gradient-to-r from-slate-900 via-brand-700 to-red-600 mb-6 -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 print:h-2" />

            {/* Document Header with Logo and Company Info */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0">
                  <img
                    src="/logo.jpg"
                    alt="ElectCare - Feel The Excellence"
                    className="h-12 w-auto max-w-[120px] object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-extrabold text-lg text-slate-900 tracking-tight uppercase">
                    SVG ELECTRIC & CONTROL PRODUCTS
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    SF No. 342/1, Trichy Road, Singanallur, Coimbatore - 641005, Tamil Nadu, India
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Phone: +91 94432 55678 • Email: sales@svgelectric.com • Web: https://svgelectric.com
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="inline-block bg-slate-900 text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">
                  SPECIFICATION SHEET
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Date: {format(new Date(), 'dd-MMM-yyyy')}
                </p>
              </div>
            </div>

            {/* Product Title Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase bg-brand-100 text-brand-800 px-2 py-0.5 rounded">
                    {product.category?.name || 'Switchboard / Control Panel'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    Code: {product.productCode}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Optional Price Badge */}
              {includePrice && (
                <div className="bg-white border-2 border-brand-500/40 rounded-xl p-3.5 text-right shadow-sm flex-shrink-0">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block tracking-wider">
                    Price (Ex-Works)
                  </span>
                  <span className="text-xl font-extrabold text-brand-700 font-mono block">
                    {formatINR(product.price)}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    + Applicable GST & Freight
                  </span>
                </div>
              )}
            </div>

            {/* Technical Specifications Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Technical Specifications & Engineering Parameters
                </h3>
                <span className="text-[10px] font-mono text-slate-500">
                  {specs.length} Verified Parameters
                </span>
              </div>

              {specs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Standard factory panel specifications apply.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-mono text-[10px]">
                        <th className="py-2.5 px-4 font-bold text-left w-12 text-slate-500">#</th>
                        <th className="py-2.5 px-4 font-bold text-left w-1/3">Parameter</th>
                        <th className="py-2.5 px-4 font-bold text-left">Technical Specification / Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {specs.map((spec, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                        >
                          <td className="py-2 px-4 font-mono text-slate-400 text-[11px]">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-800">
                            {spec.name}
                          </td>
                          <td className="py-2 px-4 font-mono font-medium text-slate-900">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attached Image Preview (if image) */}
            {product.fileUrl && product.fileType === 'IMAGE' && (
              <div className="mb-6 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <h4 className="text-[11px] font-mono font-bold uppercase text-slate-700 mb-2">
                  Reference Visual / Dimensional Drawing
                </h4>
                <div className="flex justify-center bg-white p-2 rounded border border-slate-200 max-h-56 overflow-hidden">
                  <img
                    src={product.fileUrl}
                    alt={product.name}
                    className="max-h-52 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Attached PDF Reference Note (if PDF) */}
            {product.fileUrl && product.fileType === 'PDF' && (
              <div className="mb-6 border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Supplementary Technical Datasheet Attached: {product.fileName || 'datasheet.pdf'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Complete single line diagram (SLD) & component layout available in system attachment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Standards & Notes */}
            <div className="border-t border-slate-200 pt-4 mt-6 text-[10px] text-slate-500 leading-relaxed">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-bold text-slate-700 uppercase font-mono mb-1">
                    Manufacturing & Testing Standards
                  </h5>
                  <p>
                    Manufactured in accordance with IS 8623 / IEC 61439-1&2 standards. Routine tests conducted: High Voltage Insulation Test, Continuity Test, and Functional Tripping Test.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-700 uppercase font-mono mb-1">
                    Commercial Notice
                  </h5>
                  <p>
                    {includePrice
                      ? 'The pricing stated is valid for 30 days from issue date. Subject to SVG Electric standard terms and conditions.'
                      : 'This document represents an unpriced technical submittal. For commercial quotation and delivery lead times, please contact the sales desk.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>SVG ELECTRIC & CONTROL PRODUCTS • COIMBATORE</span>
              <span>ENGINEERED FOR EXCELLENCE</span>
              <span>PAGE 1 OF 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
