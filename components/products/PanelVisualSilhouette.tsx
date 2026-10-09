'use client';

import React, { useState } from 'react';
import { ShieldCheck, Layers, Maximize2, CheckCircle2, Sliders, Cpu } from 'lucide-react';

interface PanelVisualSilhouetteProps {
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  ipRating?: string | null;
  formRating?: string | null;
  modelNumber?: string;
  modelName?: string;
  categoryName?: string;
}

export const PanelVisualSilhouette: React.FC<PanelVisualSilhouetteProps> = ({
  height = 2000,
  width = 1000,
  depth = 600,
  ipRating = 'IP54',
  formRating = 'Form 2B',
  modelNumber = 'MOD-001',
  modelName = 'Industrial Switchboard',
  categoryName = 'Control Panel',
}) => {
  const [viewMode, setViewMode] = useState<'GA_FRONT' | 'ISOMETRIC'>('GA_FRONT');
  const [doorsOpen, setDoorsOpen] = useState(false);

  const h = height && height > 500 ? height : 2000;
  const w = width && width > 400 ? width : 1000;
  const d = depth && depth > 200 ? depth : 600;

  // Aspect ratio calculations for proportional SVG viewport
  // Target SVG height around 220px, calculate width proportionally
  const aspectRatio = w / h;
  const svgHeight = 220;
  const panelHeight = 175;
  const panelWidth = Math.min(220, Math.max(90, Math.round(panelHeight * aspectRatio)));
  const plinthHeight = 12;
  const canopyHeight = 8;
  const panelX = 40;
  const panelY = 22;

  const isMultiDoor = w >= 1200;
  const isTripleDoor = w >= 1800;

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-4 text-white border border-slate-800 shadow-xl overflow-hidden relative">
      {/* Subtle Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <Sliders className="w-3 h-3 text-blue-400" />
            IEC 61439 GA Dimensional Profile
          </span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Form Factor Compliance
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setDoorsOpen(!doorsOpen)}
            className={`px-2 py-0.5 rounded transition-all ${
              doorsOpen
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {doorsOpen ? 'Door: OPEN' : 'Door: CLOSED'}
          </button>
        </div>
      </div>

      {/* Main SVG Visualization Container */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-1 relative z-10">
        {/* SVG Drawing Canvas */}
        <div className="relative flex items-center justify-center">
          <svg
            width={panelWidth + 90}
            height={svgHeight}
            viewBox={`0 0 ${panelWidth + 90} ${svgHeight}`}
            className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none"
          >
            <defs>
              {/* Powder coat metallic gradient RAL 7035 */}
              <linearGradient id="ral7035Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="30%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              {/* Plinth Base Channel Steel Gradient */}
              <linearGradient id="plinthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Internal Chamber Gradient (when open) */}
              <linearGradient id="interiorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Door Bevel Shadow */}
              <linearGradient id="doorBevel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="10%" stopColor="#000000" stopOpacity="0" />
                <stop offset="90%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Height Dimension Line (Left Side) */}
            <g className="text-slate-400 font-mono text-[9px]">
              <line x1={panelX - 18} y1={panelY} x2={panelX - 18} y2={panelY + panelHeight} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
              {/* Top & Bottom Ticks */}
              <line x1={panelX - 22} y1={panelY} x2={panelX - 14} y2={panelY} stroke="#94a3b8" strokeWidth="1.2" />
              <line x1={panelX - 22} y1={panelY + panelHeight} x2={panelX - 14} y2={panelY + panelHeight} stroke="#94a3b8" strokeWidth="1.2" />
              {/* Height Label */}
              <text
                x={panelX - 24}
                y={panelY + panelHeight / 2}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                transform={`rotate(-90 ${panelX - 24} ${panelY + panelHeight / 2})`}
              >
                H: {h} mm
              </text>
            </g>

            {/* Width Dimension Line (Top Side) */}
            <g className="text-slate-400 font-mono text-[9px]">
              <line x1={panelX} y1={panelY - 12} x2={panelX + panelWidth} y2={panelY - 12} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
              {/* Left & Right Ticks */}
              <line x1={panelX} y1={panelY - 16} x2={panelX} y2={panelY - 8} stroke="#94a3b8" strokeWidth="1.2" />
              <line x1={panelX + panelWidth} y1={panelY - 16} x2={panelX + panelWidth} y2={panelY - 8} stroke="#94a3b8" strokeWidth="1.2" />
              {/* Width Label */}
              <text
                x={panelX + panelWidth / 2}
                y={panelY - 15}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
              >
                W: {w} mm
              </text>
            </g>

            {/* Plinth Base Frame (100mm standard channel) */}
            <rect
              x={panelX + 2}
              y={panelY + panelHeight - plinthHeight}
              width={panelWidth - 4}
              height={plinthHeight}
              fill="url(#plinthGrad)"
              stroke="#475569"
              strokeWidth="0.8"
              rx="1"
            />
            {/* Plinth Foundation Bolt Slots */}
            <circle cx={panelX + 12} cy={panelY + panelHeight - plinthHeight / 2} r="2" fill="#64748b" />
            <circle cx={panelX + panelWidth - 12} cy={panelY + panelHeight - plinthHeight / 2} r="2" fill="#64748b" />
            {isMultiDoor && (
              <circle cx={panelX + panelWidth / 2} cy={panelY + panelHeight - plinthHeight / 2} r="2" fill="#64748b" />
            )}

            {/* Canopy / Top Eyebolts */}
            <g>
              <ellipse cx={panelX + 10} cy={panelY - 2} rx="4" ry="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx={panelX + panelWidth - 10} cy={panelY - 2} rx="4" ry="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            </g>

            {/* Main Enclosure Body (Powder Coated CRCA Steel) */}
            <rect
              x={panelX}
              y={panelY}
              width={panelWidth}
              height={panelHeight - plinthHeight}
              fill={doorsOpen ? 'url(#interiorGrad)' : 'url(#ral7035Grad)'}
              stroke="#334155"
              strokeWidth="1.5"
              rx="2"
            />

            {/* IF DOORS OPEN: SHOW INTERNAL COMPARTMENTATION (IEC FORM 4B/2B) */}
            {doorsOpen ? (
              <g>
                {/* Internal Busbar Chamber (Top) */}
                <rect
                  x={panelX + 4}
                  y={panelY + 4}
                  width={panelWidth - 8}
                  height={24}
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="0.8"
                  rx="1"
                />
                <text x={panelX + 8} y={panelY + 16} fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace">
                  BUSBAR ALCOVE (R-Y-B)
                </text>
                {/* 3 Phase Busbar Lines */}
                <line x1={panelX + 8} y1={panelY + 20} x2={panelX + panelWidth - 8} y2={panelY + 20} stroke="#ef4444" strokeWidth="2" />
                <line x1={panelX + 8} y1={panelY + 22.5} x2={panelX + panelWidth - 8} y2={panelY + 22.5} stroke="#eab308" strokeWidth="2" />
                <line x1={panelX + 8} y1={panelY + 25} x2={panelX + panelWidth - 8} y2={panelY + 25} stroke="#3b82f6" strokeWidth="2" />

                {/* Switchgear / Functional Units */}
                <rect
                  x={panelX + 6}
                  y={panelY + 34}
                  width={panelWidth - 12}
                  height={panelHeight - plinthHeight - 42}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="0.8"
                />
                {/* Component Outline / Breakers */}
                <rect
                  x={panelX + 12}
                  y={panelY + 42}
                  width={panelWidth - 24}
                  height={32}
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth="0.8"
                  rx="2"
                />
                <text x={panelX + panelWidth / 2} y={panelY + 60} textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                  MAIN INCOMER BREAKER
                </text>

                {/* Lower Outgoing Feeders / Cable Alley */}
                <rect
                  x={panelX + 12}
                  y={panelY + 80}
                  width={panelWidth - 24}
                  height={panelHeight - plinthHeight - 90}
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <text x={panelX + panelWidth / 2} y={panelY + 105} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                  CABLE ENTRY / FEEDERS
                </text>
              </g>
            ) : (
              /* DOORS CLOSED: EXTERNAL ELEVATION GA DETAILS */
              <g>
                {/* Single or Multi-Bay Door Seams */}
                {isTripleDoor ? (
                  <>
                    <line x1={panelX + panelWidth / 3} y1={panelY + 2} x2={panelX + panelWidth / 3} y2={panelY + panelHeight - plinthHeight - 2} stroke="#64748b" strokeWidth="1.2" />
                    <line x1={panelX + (panelWidth * 2) / 3} y1={panelY + 2} x2={panelX + (panelWidth * 2) / 3} y2={panelY + panelHeight - plinthHeight - 2} stroke="#64748b" strokeWidth="1.2" />
                  </>
                ) : isMultiDoor ? (
                  <line x1={panelX + panelWidth / 2} y1={panelY + 2} x2={panelX + panelWidth / 2} y2={panelY + panelHeight - plinthHeight - 2} stroke="#64748b" strokeWidth="1.2" />
                ) : null}

                {/* Top Metering / Indication Compartment Facia */}
                <rect
                  x={panelX + 6}
                  y={panelY + 6}
                  width={panelWidth - 12}
                  height={28}
                  fill="#e2e8f0"
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                  rx="1"
                />

                {/* R-Y-B Phase Indicator Lamps */}
                <circle cx={panelX + 14} cy={panelY + 14} r="2.5" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.5" />
                <circle cx={panelX + 22} cy={panelY + 14} r="2.5" fill="#eab308" stroke="#713f12" strokeWidth="0.5" />
                <circle cx={panelX + 30} cy={panelY + 14} r="2.5" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="0.5" />

                {/* Digital Multifunction Meter Display Window */}
                <rect
                  x={panelX + panelWidth - 36}
                  y={panelY + 10}
                  width={28}
                  height={18}
                  fill="#0f172a"
                  stroke="#475569"
                  strokeWidth="0.8"
                  rx="1"
                />
                <text x={panelX + panelWidth - 22} y={panelY + 22} textAnchor="middle" fill="#22c55e" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                  415 V
                </text>

                {/* Breaker Rotary Operating Handle */}
                <rect
                  x={panelX + panelWidth / 2 - 9}
                  y={panelY + 54}
                  width={18}
                  height={26}
                  fill="#334155"
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  rx="1"
                />
                <circle cx={panelX + panelWidth / 2} cy={panelY + 67} r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                <line x1={panelX + panelWidth / 2} y1={panelY + 67} x2={panelX + panelWidth / 2} y2={panelY + 62} stroke="#ef4444" strokeWidth="2" />

                {/* Quarter-Turn Door Key-Locks & Handles */}
                <circle cx={panelX + panelWidth - 10} cy={panelY + 48} r="2.5" fill="#475569" stroke="#94a3b8" strokeWidth="0.6" />
                <circle cx={panelX + panelWidth - 10} cy={panelY + panelHeight - plinthHeight - 35} r="2.5" fill="#475569" stroke="#94a3b8" strokeWidth="0.6" />

                {/* Ventilation Louvers (Bottom Corner) */}
                <g stroke="#94a3b8" strokeWidth="0.7">
                  <line x1={panelX + 12} y1={panelY + panelHeight - plinthHeight - 22} x2={panelX + 34} y2={panelY + panelHeight - plinthHeight - 22} />
                  <line x1={panelX + 12} y1={panelY + panelHeight - plinthHeight - 18} x2={panelX + 34} y2={panelY + panelHeight - plinthHeight - 18} />
                  <line x1={panelX + 12} y1={panelY + panelHeight - plinthHeight - 14} x2={panelX + 34} y2={panelY + panelHeight - plinthHeight - 14} />
                </g>

                {/* SVG Electric Brand Monogram Plate */}
                <rect
                  x={panelX + 10}
                  y={panelY + panelHeight - plinthHeight - 34}
                  width={28}
                  height={7}
                  fill="#0b2545"
                  stroke="#cbd5e1"
                  strokeWidth="0.5"
                  rx="0.5"
                />
                <text x={panelX + 24} y={panelY + panelHeight - plinthHeight - 29} textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">
                  SVG ELECTRIC
                </text>
              </g>
            )}

            {/* Depth Annotation Indicator (Right Side) */}
            <g className="text-slate-400 font-mono text-[9px]">
              <path
                d={`M ${panelX + panelWidth + 10} ${panelY + 20} L ${panelX + panelWidth + 24} ${panelY + 10} L ${panelX + panelWidth + 24} ${panelY + panelHeight - plinthHeight - 10} L ${panelX + panelWidth + 10} ${panelY + panelHeight - plinthHeight}`}
                fill="#334155"
                fillOpacity="0.4"
                stroke="#64748b"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              <text
                x={panelX + panelWidth + 30}
                y={panelY + panelHeight / 2}
                textAnchor="start"
                fill="#38bdf8"
                fontSize="8.5"
                fontWeight="bold"
              >
                D: {d} mm
              </text>
            </g>
          </svg>
        </div>

        {/* Technical Specification Summary Callouts */}
        <div className="flex-1 space-y-2 text-xs font-mono w-full">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>ENCLOSURE FOOTPRINT:</span>
              <strong className="text-white font-bold">{h}H × {w}W × {d}D mm</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>CONSTRUCTION:</span>
              <span className="text-slate-200">2.0mm CRCA Sheet Steel</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>FINISH SHADE:</span>
              <span className="text-slate-200">Pure Polyester RAL 7032/7035</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>PLINTH BASE:</span>
              <span className="text-slate-200">100mm Channel Iron Base</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40">
              <span className="text-[10px] text-blue-400 block uppercase">INGRESS RATING</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                {ipRating || 'IP54'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40">
              <span className="text-[10px] text-amber-400 block uppercase">SEPARATION FORM</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                {formRating || 'Form 2B / 4B'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
