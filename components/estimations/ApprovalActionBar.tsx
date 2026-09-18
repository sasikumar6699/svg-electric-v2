'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Send,
  RotateCcw,
  Edit,
  FileText,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface ApprovalActionBarProps {
  estimationId: string;
  estimationNumber: string;
  status: string;
  creatorName: string;
  createdAt: string;
  currentUserRole: string;
  approverName?: string | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
}

export function ApprovalActionBar({
  estimationId,
  estimationNumber,
  status,
  creatorName,
  createdAt,
  currentUserRole,
  approverName,
  approvedAt,
  approvalRemarks,
}: ApprovalActionBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<'reject' | 'revise' | 'approve' | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = currentUserRole === 'ADMIN';

  // 1. APPROVE ACTION
  const handleConfirmApprove = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: reasonInput.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve');

      setFeedback({ type: 'success', message: `Estimation ${estimationNumber} has been approved successfully!` });
      setModalType(null);
      setReasonInput('');
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error approving estimation' });
    } finally {
      setLoading(false);
    }
  };

  // 2. REVISE ACTION (Demands Reason)
  const handleConfirmRevise = async () => {
    if (!reasonInput.trim()) {
      alert('Please provide the revision reason or instructions for the sales engineer.');
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: reasonInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request revision');

      setFeedback({
        type: 'success',
        message: `Estimation ${estimationNumber} sent back to sales engineer for revision.`,
      });
      setModalType(null);
      setReasonInput('');
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error requesting revision' });
    } finally {
      setLoading(false);
    }
  };

  // 3. REJECT ACTION (Demands Reason)
  const handleConfirmReject = async () => {
    if (!reasonInput.trim()) {
      alert('Please enter a mandatory reason for rejecting this estimation.');
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: reasonInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject');

      setFeedback({
        type: 'success',
        message: `Estimation ${estimationNumber} has been marked as REJECTED.`,
      });
      setModalType(null);
      setReasonInput('');
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting estimation' });
    } finally {
      setLoading(false);
    }
  };

  // 4. RESUBMIT ACTION (Sales User resubmits for admin review)
  const handleResubmit = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resubmit');

      setFeedback({ type: 'success', message: `Estimation ${estimationNumber} resubmitted for Admin review.` });
      router.refresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error resubmitting estimation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5 text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* --- STATUS: PENDING_APPROVAL --- */}
      {status === 'PENDING_APPROVAL' && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider font-mono">
                    Pending Management Approval
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                    Awaiting Review
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Submitted by <strong className="font-semibold text-amber-950">{creatorName}</strong> on{' '}
                  {format(new Date(createdAt), 'dd MMM yyyy, hh:mm a')}.
                  {isAdmin
                    ? ' Please evaluate the technical specifications and commercial terms below before processing.'
                    : ' This quotation is locked and currently awaiting review and sign-off by an Administrator.'}
                </p>
              </div>
            </div>

            {/* Admin 3 Process Buttons: Reject, Revise, Approve */}
            {isAdmin ? (
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* 1. REJECT BUTTON */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setReasonInput('');
                    setModalType('reject');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  title="Reject this estimation"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Reject</span>
                </button>

                {/* 2. REVISE BUTTON */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setReasonInput('');
                    setModalType('revise');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-amber-300 bg-amber-100/60 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  title="Request changes from sales engineer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  <span>Revise</span>
                </button>

                {/* 3. APPROVE BUTTON */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setReasonInput('');
                    setModalType('approve');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  title="Formally approve estimation"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            ) : (
              <div className="text-right">
                <span className="inline-block px-3 py-1.5 bg-amber-100/90 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200">
                  Locked for Admin Review
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STATUS: REVISION_REQUESTED --- */}
      {status === 'REVISION_REQUESTED' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RotateCcw className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider font-mono">
                    Revision Requested by Management
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Sent back by <strong className="font-semibold text-amber-950">{approverName || 'Administrator'}</strong>
                  {approvedAt && <> on {format(new Date(approvedAt), 'dd MMM yyyy, hh:mm a')}</>}.
                </p>
                {approvalRemarks && (
                  <div className="mt-2.5 bg-white p-3 rounded-lg border border-amber-300 text-xs">
                    <span className="font-bold text-amber-950 block mb-0.5">Required Changes / Reason:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">{approvalRemarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/estimations/${estimationId}/edit`}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit & Revise Estimation</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- STATUS: APPROVED --- */}
      {status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider font-mono">
                    Management Approved
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    Ready for Client
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1">
                  Authorized by <strong className="font-semibold text-emerald-950">{approverName || 'Administrator'}</strong>
                  {approvedAt && <> on {format(new Date(approvedAt), 'dd MMM yyyy, hh:mm a')}</>}.
                  This quotation is formally approved for commercial release.
                </p>
                {approvalRemarks && (
                  <p className="text-xs italic text-emerald-800 mt-1.5 bg-emerald-100/60 px-2.5 py-1 rounded border border-emerald-200/50">
                    Approval Notes: &quot;{approvalRemarks}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STATUS: REJECTED --- */}
      {status === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wider font-mono">
                    Estimation Rejected
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                    Rejected
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  Rejected by <strong className="font-semibold text-rose-950">{approverName || 'Administrator'}</strong>
                  {approvedAt && <> on {format(new Date(approvedAt), 'dd MMM yyyy, hh:mm a')}</>}.
                </p>
                {approvalRemarks && (
                  <div className="mt-2 bg-white p-2.5 rounded-lg border border-rose-200 text-xs">
                    <span className="font-bold text-rose-900 block mb-0.5">Rejection Reason:</span>
                    <p className="text-slate-800 leading-relaxed">{approvalRemarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleResubmit}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Resubmit for Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE ACTION MODAL (FOR REJECT / REVISE / APPROVE) --- */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {modalType === 'reject' && <XCircle className="w-5 h-5 text-rose-600" />}
                {modalType === 'revise' && <RotateCcw className="w-5 h-5 text-amber-600" />}
                {modalType === 'approve' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                <h3 className="font-bold text-sm text-slate-900">
                  {modalType === 'reject' && `Reject Estimation #${estimationNumber}`}
                  {modalType === 'revise' && `Request Revision for #${estimationNumber}`}
                  {modalType === 'approve' && `Approve Estimation #${estimationNumber}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Instructions */}
            <div className="text-xs text-slate-600">
              {modalType === 'reject' && (
                <p>
                  Please specify the reason for rejection. This quotation will be placed under{' '}
                  <strong className="text-rose-700">Rejected Estimations</strong>.
                </p>
              )}
              {modalType === 'revise' && (
                <p>
                  Specify the adjustments or technical corrections required. The sales engineer will be notified to edit
                  according to this reason and resubmit for your approval.
                </p>
              )}
              {modalType === 'approve' && (
                <p>
                  This estimation will be authorized and tagged as{' '}
                  <strong className="text-emerald-700">Approved</strong>. You may optionally include internal approval
                  remarks.
                </p>
              )}
            </div>

            {/* Textarea Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {modalType === 'reject' && 'Rejection Reason (Mandatory):'}
                {modalType === 'revise' && 'Required Revisions & Reason (Mandatory):'}
                {modalType === 'approve' && 'Approval Remarks (Optional):'}
              </label>
              <textarea
                rows={3}
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder={
                  modalType === 'reject'
                    ? 'Enter specific reason for rejection (e.g. Unviable component specifications, client budget mismatch)...'
                    : modalType === 'revise'
                    ? 'e.g. Reduce discount to 3%, update starter type to Star-Delta, and include 5% freight charges...'
                    : "e.g. Technical specifications verified and 5% commercial discount approved..."
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                autoFocus
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              {modalType === 'reject' && (
                <button
                  type="button"
                  disabled={loading || !reasonInput.trim()}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Confirm Rejection</span>
                </button>
              )}

              {modalType === 'revise' && (
                <button
                  type="button"
                  disabled={loading || !reasonInput.trim()}
                  onClick={handleConfirmRevise}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Send for Revision</span>
                </button>
              )}

              {modalType === 'approve' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmApprove}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm Approval</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}