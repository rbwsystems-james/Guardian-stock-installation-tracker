import React, { useState } from 'react';
import { SKU_CONFIG, SKU_KEYS } from './constants';

export default function InventoryPanel({ stockLevels, metrics, onUpdateStock }) {
  const [showTotals, setShowTotals] = useState(false);
  const [editingBuilt, setEditingBuilt] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [editingTotal, setEditingTotal] = useState(null);
  const [editTotalVal, setEditTotalVal] = useState('');

  const { committed, spare, inbound } = metrics;

  const handleBuiltClick = (sku, current) => {
    setEditingBuilt(sku);
    setEditVal(String(current));
  };

  const handleBuiltSave = (sku) => {
    const sl = stockLevels.find(s => s.sku === sku);
    const val = Math.max(0, Math.min(parseInt(editVal) || 0, sl?.total || 0));
    onUpdateStock(sku, { built: val });
    setEditingBuilt(null);
  };

  const handleTotalSave = (sku) => {
    const sl = stockLevels.find(s => s.sku === sku);
    const val = Math.max(0, parseInt(editTotalVal) || 0);
    const updates = { total: val };
    if ((sl?.built || 0) > val) updates.built = val;
    onUpdateStock(sku, updates);
    setEditingTotal(null);
  };

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DFE1E6]">
        <h2 className="text-sm font-semibold text-[#1C2024]">Inventory & Build Status</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-[#6E7781]">Show totals</span>
          <button
            onClick={() => setShowTotals(!showTotals)}
            className={`relative w-8 h-[18px] rounded-full transition-colors ${showTotals ? 'bg-[#2563EB]' : 'bg-[#DFE1E6]'}`}
          >
            <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${showTotals ? 'left-[16px]' : 'left-[2px]'}`} />
          </button>
        </label>
      </div>

      <div className="flex divide-x divide-[#DFE1E6]">
        {SKU_KEYS.map(sku => {
          const cfg = SKU_CONFIG[sku];
          const sl = stockLevels.find(s => s.sku === sku) || { total: 0, built: 0 };
          const comm = committed[sku];
          const sp = spare[sku];
          const inb = inbound[sku];
          const unbuilt = sl.total - sl.built;

          // Bar segments
          const barTotal = Math.max(sl.total, comm, 1);
          const segments = [];
          if (unbuilt > 0) segments.push({ width: (unbuilt / barTotal) * 100, color: '#DFE1E6', label: `${unbuilt} unbuilt` });
          if (sp > 0) segments.push({ width: (sp / barTotal) * 100, color: '#059669', label: `${sp} spare` });
          if (comm > 0) segments.push({ width: (comm / barTotal) * 100, color: cfg.color, label: `${comm} committed` });
          if (sp < 0) segments.push({ width: (Math.abs(sp) / barTotal) * 100, color: '#DC2626', label: `${Math.abs(sp)} short` });

          return (
            <div key={sku} className="flex-1 p-4 min-w-0">
              {/* SKU Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-[10px] h-[10px] rounded-sm" style={{ background: cfg.color }} />
                  <span className="text-sm font-medium text-[#1C2024]">{cfg.label}</span>
                  <span className="text-xs text-[#6E7781]">({cfg.short})</span>
                </div>
                {inb > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-medium">+{inb} inbound</span>
                )}
              </div>

              {/* Hero Numbers */}
              <div className="flex divide-x divide-[#DFE1E6] mb-4">
                {[
                  { label: 'BUILT', value: sl.built, editable: true },
                  { label: 'COMMITTED', value: comm },
                  { label: 'SPARE', value: sp, spare: true },
                ].map(item => (
                  <div key={item.label} className="flex-1 text-center px-2">
                    <div className="text-[9px] font-bold tracking-[0.1em] text-[#9CA3AF] mb-1">{item.label}</div>
                    {item.editable && editingBuilt === sku ? (
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={() => handleBuiltSave(sku)}
                        onKeyDown={e => e.key === 'Enter' && handleBuiltSave(sku)}
                        className="w-full text-center font-mono text-[28px] font-bold border-2 border-[#2563EB] rounded outline-none"
                        style={{ color: cfg.color }}
                        autoFocus
                        min={0}
                        max={sl.total}
                      />
                    ) : item.editable ? (
                      <div
                        className="font-mono text-[28px] font-bold cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ color: cfg.color }}
                        onClick={() => handleBuiltClick(sku, sl.built)}
                        title="Click to edit"
                      >
                        {sl.built}
                      </div>
                    ) : item.spare ? (
                      <div
                        className="font-mono text-[28px] font-bold"
                        style={{ color: sp > 0 ? '#059669' : sp === 0 ? '#D97706' : '#DC2626' }}
                      >
                        {sp}
                      </div>
                    ) : (
                      <div className={`font-mono text-[28px] font-bold ${comm > 0 ? 'text-[#1C2024]' : 'text-[#9CA3AF]'}`}>
                        {comm}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bar */}
              <div className="h-2 rounded-full bg-[#F4F5F7] flex overflow-hidden mb-1.5">
                {segments.map((seg, i) => (
                  <div key={i} className="h-full rounded-full" style={{ width: `${seg.width}%`, background: seg.color, minWidth: seg.width > 0 ? '2px' : 0 }} />
                ))}
              </div>
              <div className="text-[10px] text-[#6E7781]">
                {segments.map(s => s.label).join(' · ')}
              </div>

              {/* Totals detail */}
              {showTotals && (
                <div className="mt-3 p-3 bg-[#F8F9FA] rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6E7781]">Total Stock</span>
                    {editingTotal === sku ? (
                      <input
                        type="number"
                        value={editTotalVal}
                        onChange={e => setEditTotalVal(e.target.value)}
                        onBlur={() => handleTotalSave(sku)}
                        onKeyDown={e => e.key === 'Enter' && handleTotalSave(sku)}
                        className="w-20 text-right font-mono text-sm font-bold border border-[#2563EB] rounded px-1 outline-none"
                        autoFocus
                        min={0}
                      />
                    ) : (
                      <span
                        className="font-mono text-sm font-bold text-[#1C2024] cursor-pointer hover:opacity-70"
                        onClick={() => { setEditingTotal(sku); setEditTotalVal(String(sl.total)); }}
                      >
                        {sl.total}
                      </span>
                    )}
                  </div>
                  {inb > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6E7781]">Inbound (on order)</span>
                      <span className="font-mono text-sm text-[#2563EB] font-medium">{inb}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}