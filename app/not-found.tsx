import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
            HTTP 404 &bull; ROUTING EXCEPTION
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Resource or Technical Record Not Found
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested technical route, catalog item, or master record does not exist or has been relocated within the current system deployment.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-950/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Engineering Console</span>
          </Link>
          <a
            href="mailto:systems@svgelectric.com"
            className="text-[11px] text-slate-400 hover:text-slate-300 transition-colors font-mono"
          >
            Contact Engineering Support &bull; systems@svgelectric.com
          </a>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-mono text-slate-400">
        SVG Electric™ Enterprise Switchboard Estimation Suite &bull; v3.2.0-PROD
      </p>
    </div>
  );
}
