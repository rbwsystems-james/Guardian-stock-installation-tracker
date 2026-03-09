import React, { useState, useRef } from 'react';
import { Pencil, Check } from 'lucide-react';
import { SKU_CONFIG, SKU_KEYS } from './constants';

export default function InventoryPanel({ stockLevels, metrics, onUpdateStock }) {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const exitingRef = useRef(false);

  const { committed, spare, inbound } = metrics;

  const enterEditMode = () => {
    const values = {};
    SKU_KEYS.forEach(sku => {
      const sl = stockLevels.find(s => s.sku === sku) || { total: 0, built: 0 };
      values[sku] = { total: String(sl.total), built: String(sl.built) };
    });
    setEditValues(values);
    setEditing(true);
  };

  const exitEditMode = () => {
    exitingRef.current = true;
    // Save all changes
    SKU_KEYS.forEach(sku => {
      const sl = stockLevels.find(s => s.sku === sku) || { total: 0, built: 0 };
      const vals = editValues[sku];
      if (!vals) return;

      const newTotal = Math.max(0, parseInt(vals.total) || 0);
      const newBuilt = Math.max(0, Math.min(parseInt(vals.built) || 0, newTotal));

      if (newTotal !== sl.total || newBuilt !== sl.built) {
        onUpdateStock(sku, { total: newTotal, built: newBuilt });
      }
    });
    setEditing(false);
    setTimeout(() => { exitingRef.current = false; }, 0);
  };

  const updateEditValue = (sku, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [sku]: { ...prev[sku], [field]: value },
    }));
  };

  const handleFieldSave = (sku) => {
    // Skip blur saves when exiting — exitEditMode handles the final save
    if (exitingRef.current) return;

    const sl = stockLevels.find(s => s.sku === sku) || { total: 0, built: 0 };
    const vals = editValues[sku];
    if (!vals) return;

    const newTotal = Math.max(0, parseInt(vals.total) || 0);
    const newBuilt = Math.max(0, Math.min(parseInt(vals.built) || 0, newTotal));

    // Auto-clamp built in the edit state if it exceeds total
    if (newBuilt !== parseInt(vals.built)) {
      updateEditValue(sku, 'built', String(newBuilt));
    }

    // Always send both total and built together to satisfy DB constraint (built <= total)
    if (newTotal !== sl.total || newBuilt !== sl.built) {
      onUpdateStock(sku, { total: newTotal, built: newBuilt });
    }
  };

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DFE1E6]">
        <h2 className="text-sm font-semibold text-[#1C2024]">Inventory & Build Status</h2>
        {editing ? (
          <button
            onClick={exitEditMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
          >
            <Check className="w-3 h-3" />
            Done
          </button>
        ) : (
          <button
            onClick={enterEditMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6E7781] hover:text-[#1C2024] hover:bg-[#F4F5F7] rounded-md transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit Stock
          </button>
        )}
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#9CA3AF]">Total: {sl.total}</span>
                  {inb > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-medium">+{inb} inbound</span>
                  )}
                </div>
              </div>

              {/* Hero Numbers */}
              <div className="flex divide-x divide-[#DFE1E6] mb-4">
                {[
                  { label: 'BUILT', value: sl.built },
                  { label: 'COMMITTED', value: comm },
                  { label: 'SPARE', value: sp, spare: true },
                ].map(item => (
                  <div key={item.label} className="flex-1 text-center px-2">
                    <div className="text-[9px] font-bold tracking-[0.1em] text-[#9CA3AF] mb-1">{item.label}</div>
                    {item.spare ? (
                      <div
                        className="font-mono text-[28px] font-bold"
                        style={{ color: sp > 0 ? '#059669' : sp === 0 ? '#D97706' : '#DC2626' }}
                      >
                        {sp}
                      </div>
                    ) : (
                      <div className={`font-mono text-[28px] font-bold ${item.value > 0 ? 'text-[#1C2024]' : 'text-[#9CA3AF]'}`}
                        style={item.label === 'BUILT' ? { color: cfg.color } : undefined}
                      >
                        {item.value}
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
                {segments.map(s => s.label).join(' \u00B7 ')}
              </div>

              {/* Edit Fields */}
              {editing && (
                <div className="mt-3 p-3 bg-[#F8F9FA] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#6E7781]">Total Stock</label>
                    <input
                      type="number"
                      value={editValues[sku]?.total ?? ''}
                      onChange={e => updateEditValue(sku, 'total', e.target.value)}
                      onBlur={() => handleFieldSave(sku)}
                      onKeyDown={e => e.key === 'Enter' && handleFieldSave(sku)}
                      className="w-20 text-right font-mono text-sm font-bold border border-[#DFE1E6] focus:border-[#2563EB] rounded px-2 py-1 outline-none transition-colors"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#6E7781]">Built</label>
                    <input
                      type="number"
                      value={editValues[sku]?.built ?? ''}
                      onChange={e => updateEditValue(sku, 'built', e.target.value)}
                      onBlur={() => handleFieldSave(sku)}
                      onKeyDown={e => e.key === 'Enter' && handleFieldSave(sku)}
                      className="w-20 text-right font-mono text-sm font-bold border border-[#DFE1E6] focus:border-[#2563EB] rounded px-2 py-1 outline-none transition-colors"
                      min={0}
                      max={parseInt(editValues[sku]?.total) || 0}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
