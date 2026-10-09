'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  UserCog,
  Settings,
  Search,
  Tag,
  ShieldCheck,
  SlidersHorizontal,
  Boxes,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  userRole: 'ADMIN' | 'SALES_USER';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const salesNavItems = [
    {
      name: 'Search Products & Variants',
      href: '/sales/configurator',
      icon: Search,
      isActive: pathname === '/sales/configurator' && currentTab !== 'history',
    },
    {
      name: 'Recent Estimations',
      href: '/sales/configurator?tab=history',
      icon: FileSpreadsheet,
      isActive: (pathname === '/sales/configurator' && currentTab === 'history') || pathname.startsWith('/estimations'),
    },
  ];

  const adminNavItems = [
    {
      name: 'Dashboard Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      name: 'Product Catalog',
      href: '/admin/finished-goods',
      icon: Boxes,
      isActive: pathname.startsWith('/admin/finished-goods'),
    },
    {
      name: 'Price Master (Raw Materials)',
      href: '/admin/price-master',
      icon: Layers,
      isActive: pathname.startsWith('/admin/price-master'),
    },
    {
      name: 'Panel Upgradations',
      href: '/admin/panel-upgradations',
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/admin/panel-upgradations'),
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserCog,
      isActive: pathname.startsWith('/admin/users'),
    },
    {
      name: 'Company Settings',
      href: '/admin/settings',
      icon: Settings,
      isActive: pathname.startsWith('/admin/settings'),
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header - Left Top Corner Logo Area */}
      <div className="h-20 px-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 w-full group">
          {/* ElectCare Logo Badge */}
          <div className="bg-white rounded-xl p-1.5 shadow-sm border border-slate-700/60 flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:border-slate-400 transition-colors">
            <img
              src="/logo.jpg"
              alt="ElectCare - Feel The Excellence"
              className="h-9 w-auto max-w-[95px] object-contain block"
            />
          </div>

          {/* Other Brand Contents - Visible, crisp and aligned */}
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-[13px] tracking-wide text-white uppercase font-sans leading-tight whitespace-nowrap">
              SVG ELECTRIC
            </h1>
            <p className="text-[10px] font-semibold text-blue-400 font-mono tracking-wider uppercase leading-tight mt-0.5 whitespace-nowrap">
              Switchboard Estimation Suite
            </p>
            <p className="text-[9px] text-slate-400 font-sans tracking-wide leading-none mt-1 whitespace-nowrap">
              Control Products
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {/* Sales Navigation */}
        {userRole === 'SALES_USER' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Sales Engineering
            </p>
            <nav className="space-y-1">
              {salesNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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

        {/* Admin Navigation */}
        {userRole === 'ADMIN' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
              <span>Admin Masters</span>
              <span className="text-[9px] bg-blue-950/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/60 font-bold">
                ADMIN
              </span>
            </p>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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

      {/* Enterprise Provenance & Role Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 text-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Logged in as:</span>
          <span
            className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
              userRole === 'ADMIN'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {userRole === 'ADMIN' ? 'ADMINISTRATOR' : 'SALES USER'}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            v3.2.0-PROD
          </span>
          <span className="text-slate-400 font-sans">Build 2026.10-Enterprise</span>
        </div>
      </div>
    </aside>
  );
};
