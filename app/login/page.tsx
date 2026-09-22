'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ShieldCheck, Lock, Mail, ArrowRight, Loader2, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check credentials.');
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'sales') => {
    if (role === 'admin') {
      setEmail('admin@svgelectric.com');
      setPassword('Admin@12345');
    } else {
      setEmail('sales@svgelectric.com');
      setPassword('Sales@12345');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-electric-amber/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Header Branding Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white text-center relative border-b border-slate-800">
          <div className="inline-flex items-center justify-center py-2 px-3.5 rounded-xl bg-white shadow-lg border border-slate-700/50 mb-3">
            <img
              src="/logo.jpg"
              alt="ElectCare - Feel The Excellence"
              className="h-9 w-auto max-w-[130px] object-contain block"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SVG ELECTRIC</h1>
          <p className="text-xs text-brand-300 font-mono tracking-wider mt-0.5">
            ESTIMATION MANAGEMENT SYSTEM
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Internal Estimation & Sales Engineering Console
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@svgelectric.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Helpers */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center font-mono flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-600" />
              <span>Quick Demo Role Fill</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-xs group"
              >
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">admin@svgelectric.com</p>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('sales')}
                className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs group"
              >
                <div className="flex items-center gap-1.5 text-brand-700 font-semibold mb-0.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Sales Engineer</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">sales@svgelectric.com</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          SVG Electric & Control Products • Internal Confidential
        </div>
      </div>
    </div>
  );
}
