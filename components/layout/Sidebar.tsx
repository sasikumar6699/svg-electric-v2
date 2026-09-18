'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  Box,
  Sliders,
  GitFork,
  IndianRupee,
  BarChart3,
  UserCog,
  Settings,
  History,
  FileUp,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  userRole: 'ADMIN' | 'SALES_USER';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname();

  const salesNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Estimations', href: '/estimations', icon: FileSpreadsheet },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const adminNavItems = [
    { name: 'Products Catalog', href: '/admin/products', icon: Box },
    { name: 'Specifications', href: '/admin/specifications', icon: Sliders },
    { name: 'Product Specs Mapping', href: '/admin/product-specifications', icon: GitFork },
    { name: 'Pricing Matrix', href: '/admin/pricing', icon: IndianRupee },
    { name: 'Excel Import / Export', href: '/admin/import-export', icon: FileUp },
    { name: 'User Management', href: '/admin/users', icon: UserCog },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    { name: 'Company Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/60">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-electric-cyan flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm tracking-wide text-white truncate">SVG ELECTRIC</h1>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate">Estimation System</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Sales Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Sales & Estimations
          </p>
          <nav className="space-y-1">
            {salesNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Section */}
        {userRole === 'ADMIN' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
              <span>Admin Masters</span>
              <span className="text-[9px] bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50">ADMIN</span>
            </p>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-amber-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Active Role:</span>
          <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
            userRole === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
          }`}>
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
};
