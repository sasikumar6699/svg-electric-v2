import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { formatINR } from '@/lib/utils';
import {
  FileDown,
  Edit,
  Building,
  Calendar,
  Layers,
  ArrowLeft,
  Tag,
  Wrench,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ApprovalActionBar } from '@/components/estimations/ApprovalActionBar';

export default async function EstimationDetailPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) return null;

  const estimation = await db.estimation.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      items: {
        include: { itemSpecs: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!estimation) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Approval Action Bar */}
      <ApprovalActionBar
        estimationId={estimation.id}
        estimationNumber={estimation.estimationNumber}
        status={estimation.status}
        creatorName={estimation.createdBy?.name || 'Sales Engineer'}
        createdAt={estimation.createdAt.toISOString()}
        currentUserRole={session.role}
        approverName={estimation.approvedBy?.name}
        approvedAt={estimation.approvedAt ? estimation.approvedAt.toISOString() : null}
        approvalRemarks={estimation.approvalRemarks}
      />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/estimations"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-brand-600">{estimation.estimationNumber}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                  estimation.status === 'APPROVED' || estimation.status === 'FINALIZED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : estimation.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                    : estimation.status === 'REVISION_REQUESTED'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                    : estimation.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : estimation.status === 'PDF_GENERATED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {estimation.status === 'PENDING_APPROVAL'
                  ? 'PENDING APPROVAL'
                  : estimation.status === 'REVISION_REQUESTED'
                  ? 'REVISION REQUESTED'
                  : estimation.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{estimation.companyName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(estimation.status === 'DRAFT' || estimation.status === 'REVISION_REQUESTED') && (
            <Link
              href={`/estimations/${estimation.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{estimation.status === 'REVISION_REQUESTED' ? 'Edit & Revise' : 'Edit Draft'}</span>
            </Link>
          )}

          <a
            href={`/api/estimations/${estimation.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF Quotation</span>
          </a>
        </div>
      </div>

      {/* Grid: Customer Details & Estimation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Bill-To (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-brand-600" />
            <span>Customer / Billed Organization</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-mono text-[10px]">COMPANY NAME</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{estimation.companyName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-mono text-[10px]">CONTACT PERSON</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {estimation.customerName} {estimation.contactPerson ? `(${estimation.contactPerson})` : ''}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-mono text-[10px]">PHONE / MOBILE</p>
              <p className="font-mono text-slate-800 mt-0.5">{estimation.phone}</p>
            </div>
            <div>
              <p className="text-slate-400 font-mono text-[10px]">EMAIL ADDRESS</p>
              <p className="text-slate-800 mt-0.5">{estimation.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-mono text-[10px]">GSTIN</p>
              <p className="font-mono text-slate-800 mt-0.5">{estimation.gstin || 'Unregistered'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-mono text-[10px]">STATE</p>
              <p className="text-slate-800 mt-0.5">{estimation.state || 'Tamil Nadu'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-slate-400 font-mono text-[10px]">DELIVERY / PLANT ADDRESS</p>
              <p className="text-slate-700 mt-0.5">{estimation.address}</p>
            </div>
          </div>
        </div>

        {/* Estimation Metadata (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Estimation Metadata</span>
          </h2>

          <div className="space-y-2.5">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Estimation Date:</span>
              <span className="font-mono font-semibold">{format(new Date(estimation.date), 'dd-MMM-yyyy')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Reference / RFQ:</span>
              <span className="font-mono font-semibold">{estimation.referenceNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Validity Period:</span>
              <span className="font-semibold">{estimation.validityDays} Days</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Prepared By:</span>
              <span className="font-semibold">{estimation.createdBy?.name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status:</span>
              <span className="font-mono font-bold text-brand-700">{estimation.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frozen Snapshot Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Configured Products ({estimation.items.length})</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Snapshots of technical specifications and additive component prices permanently frozen on this estimation.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Product Description</th>
                <th className="px-4 py-3">Frozen Specifications Snapshot</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimation.items.map((it, idx) => (
                <tr key={it.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{it.productNameSnapshot}</p>
                    <p className="text-[10px] font-mono text-brand-600">[{it.productCodeSnapshot}]</p>
                    <p className="text-[10px] text-slate-400">{it.categorySnapshot}</p>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="flex flex-wrap gap-1">
                      {it.itemSpecs.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700"
                        >
                          <strong className="text-slate-900">{s.specName}:</strong>
                          <span>{s.optionLabel}</span>
                          {s.price > 0 && (
                            <span className="font-mono text-emerald-700 text-[9px] font-semibold">
                              (+{formatINR(s.price)})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-semibold">{it.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-mono text-slate-700 font-semibold">{formatINR(it.unitPrice)}</div>
                    {it.isManualPrice && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 font-sans">
                        <Tag className="w-2.5 h-2.5" /> Manual Override
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Totals and Rupee Words */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
            Commercial & Legal Details
          </h2>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1 font-mono uppercase text-[10px]">
              Rupees in Words:
            </span>
            <p className="font-medium text-brand-900 leading-relaxed">{estimation.amountInWords}</p>
          </div>

          {/* Charges Overview Badge */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <span className="text-[10px] text-slate-500 font-mono uppercase block flex items-center gap-1">
                <Wrench className="w-3 h-3 text-brand-600" />
                Installation Mode:
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                {estimation.installationType === 'PERCENTAGE'
                  ? `Auto (${estimation.installationRate}%)`
                  : estimation.installationType === 'FIXED'
                  ? 'Manual Fixed Entry'
                  : 'Excluded (₹0)'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <span className="text-[10px] text-slate-500 font-mono uppercase block flex items-center gap-1">
                <Truck className="w-3 h-3 text-brand-600" />
                Freight Mode:
              </span>
              <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                {estimation.freightType === 'PERCENTAGE'
                  ? `Auto (${estimation.freightRate}%)`
                  : estimation.freightType === 'FIXED'
                  ? 'Manual Fixed Entry'
                  : 'Excluded (₹0)'}
              </span>
            </div>
          </div>

          {estimation.remarks && (
            <div className="text-slate-600 pt-1">
              <span className="font-bold text-slate-700 block mb-0.5">Remarks:</span>
              <p>{estimation.remarks}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
            Financial Breakdown
          </h2>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatINR(estimation.subtotal)}</span>
          </div>

          {estimation.discountAmount > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Discount ({estimation.discountPercent}%):</span>
              <span className="font-mono text-rose-600">- {formatINR(estimation.discountAmount)}</span>
            </div>
          )}

          {estimation.installationAmount > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>
                Installation & Commissioning{' '}
                <span className="text-[10px] text-slate-400 font-mono">
                  ({estimation.installationType === 'PERCENTAGE' ? `${estimation.installationRate}%` : 'Manual'})
                </span>
                :
              </span>
              <span className="font-mono text-slate-800">+ {formatINR(estimation.installationAmount)}</span>
            </div>
          )}

          {estimation.freightAmount > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>
                Freight & Transportation{' '}
                <span className="text-[10px] text-slate-400 font-mono">
                  ({estimation.freightType === 'PERCENTAGE' ? `${estimation.freightRate}%` : 'Manual'})
                </span>
                :
              </span>
              <span className="font-mono text-slate-800">+ {formatINR(estimation.freightAmount)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 text-slate-700 font-semibold border-t border-slate-100">
            <span>Taxable Assessable Value:</span>
            <span className="font-mono">{formatINR(estimation.taxableAmount)}</span>
          </div>

          {estimation.taxType === 'INTRA_STATE' ? (
            <>
              <div className="flex justify-between py-1 text-slate-500">
                <span>CGST ({estimation.cgstRate}%):</span>
                <span className="font-mono">{formatINR(estimation.cgstAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500">
                <span>SGST ({estimation.sgstRate}%):</span>
                <span className="font-mono">{formatINR(estimation.sgstAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 text-slate-500">
              <span>IGST ({estimation.igstRate}%):</span>
              <span className="font-mono">{formatINR(estimation.igstAmount)}</span>
            </div>
          )}

          <div className="flex justify-between p-3 rounded-lg bg-slate-900 text-white font-bold text-sm items-center mt-2 shadow-xs">
            <span>ESTIMATED GRAND TOTAL:</span>
            <span className="font-mono text-base text-brand-300">{formatINR(estimation.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}