'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SALES_USER';
  };
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const isAdmin = user.role === 'ADMIN';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 hidden sm:inline">
          SVG ELECTRIC & CONTROL PRODUCTS
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          {isAdmin ? 'Product & Technical Management Console' : 'Product Search & Price Discovery'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin Quick Action Button */}
        {isAdmin && (
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        )}

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold font-mono">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">
              {isAdmin ? 'ADMINISTRATOR' : 'SALES ENGINEER'}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
