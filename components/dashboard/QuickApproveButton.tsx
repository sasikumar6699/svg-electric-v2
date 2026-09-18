'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export function QuickApproveButton({
  estimationId,
  estimationNumber,
}: {
  estimationId: string;
  estimationNumber: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Quick Approve estimation ${estimationNumber}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleApprove}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
      title="Quick Approve this estimation"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
      <span>Approve</span>
    </button>
  );
}