'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Audit trace for enterprise logging
    console.error('System Runtime Incident:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            SYSTEM RUNTIME EXCEPTION &bull; MODULE RECOVERY
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Unexpected Operation Interruption
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The system encountered an unhandled exception during processing. Technical state has been safeguarded to protect active estimation records.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
              Incident Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-950/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Module</span>
          </button>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Console</span>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-mono text-slate-400">
        SVG Electric™ Enterprise Switchboard Estimation Suite &bull; Systems Engineering Team
      </p>
    </div>
  );
}
