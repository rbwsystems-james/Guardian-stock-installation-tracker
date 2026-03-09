import React, { useState, useMemo } from 'react';
import { SKU_CONFIG, SKU_KEYS } from './constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockProjectionChart({ stockLevels, installs, supplierOrders }) {
  const [selectedSku, setSelectedSku] = useState('gmu');
  const [showTotal, setShowTotal] = useState(false);

  const skusToShow = selectedSku === 'all' ? SKU_KEYS : [selectedSku];

  const projectionData = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 6);

    const data = {};
    skusToShow.forEach(sku => {
      const sl = stockLevels.find(s => s.sku === sku) || { total: 0, built: 0 };
      let built = sl.built;
      let total = sl.total;
      const events = [];

      // Install deductions
      installs
        .filter(i => i.status !== 'Complete' && i.status !== 'Site Survey Scheduled' && i.installDate)
        .forEach(i => {
          const units = i[SKU_CONFIG[sku].field] || 0;
          if (units > 0) {
            events.push({ date: new Date(i.installDate), builtDelta: -units, totalDelta: -units, label: i.site });
          }
        });

      // Supplier additions
      (supplierOrders || [])
        .filter(o => o.status !== 'Delivered' && o.sku === sku && o.expectedDate)
        .forEach(o => {
          events.push({ date: new Date(o.expectedDate), builtDelta: 0, totalDelta: o.qty || 0, label: o.supplier });
        });

      events.sort((a, b) => a.date - b.date);

      const points = [{ date: now, built, total }];
      events.forEach(e => {
        if (e.date >= now && e.date <= end) {
          built += e.builtDelta;
          total += e.totalDelta;
          points.push({ date: e.date, built, total, label: e.label });
        }
      });
      points.push({ date: end, built, total });
      data[sku] = points;
    });

    return data;
  }, [skusToShow, stockLevels, installs, supplierOrders]);

  // SVG dimensions
  const W = 800;
  const H = 280;
  const PAD = { top: 30, bottom: 40, left: 55, right: 55 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 6);
  const timeRange = end - now;

  const toX = (date) => PAD.left + ((date - now) / timeRange) * chartW;
  const nowX = toX(now);

  // Determine Y scales
  const allBuiltVals = [];
  const allTotalVals = [];
  Object.values(projectionData).forEach(pts => {
    pts.forEach(p => {
      allBuiltVals.push(p.built);
      if (showTotal) allTotalVals.push(p.total);
    });
  });
  const maxVal = Math.max(10, ...allBuiltVals, ...allTotalVals);
  const minVal = Math.min(0, ...allBuiltVals);
  const range = maxVal - minVal || 1;

  const toY = (val) => PAD.top + chartH - ((val - minVal) / range) * chartH;

  // Month labels
  const monthLabels = useMemo(() => {
    const labels = [];
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    while (d <= end) {
      labels.push({ date: new Date(d), label: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() });
      d.setMonth(d.getMonth() + 1);
    }
    return labels;
  }, []);

  const makeStepPath = (points, key) => {
    if (points.length < 2) return '';
    let d = `M ${toX(points[0].date)} ${toY(points[0][key])}`;
    for (let i = 1; i < points.length; i++) {
      const x = toX(points[i].date);
      const prevY = toY(points[i - 1][key]);
      d += ` H ${x} V ${toY(points[i][key])}`;
    }
    return d;
  };

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DFE1E6]">
        <div>
          <h2 className="text-sm font-semibold text-[#1C2024]">Stock Projection</h2>
          <p className="text-[10px] text-[#6E7781]">Built (ready to ship) over 6 months</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] text-[#6E7781]">Show total (incl. unbuilt)</span>
            <button
              onClick={() => setShowTotal(!showTotal)}
              className={`relative w-8 h-[18px] rounded-full transition-colors ${showTotal ? 'bg-[#2563EB]' : 'bg-[#DFE1E6]'}`}
            >
              <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${showTotal ? 'left-[16px]' : 'left-[2px]'}`} />
            </button>
          </label>
          <Select value={selectedSku} onValueChange={setSelectedSku}>
            <SelectTrigger className="w-36 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmu">GMUs</SelectItem>
              <SelectItem value="sc">Site Controller</SelectItem>
              <SelectItem value="cc">Coin Counter</SelectItem>
              <SelectItem value="all">All SKUs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pt-3 flex gap-4 flex-wrap">
        {skusToShow.map(sku => (
          <div key={sku} className="flex items-center gap-2 text-[10px]">
            <div className="w-4 h-[2.5px] rounded" style={{ background: SKU_CONFIG[sku].color }} />
            <span className="text-[#6E7781]">{SKU_CONFIG[sku].label} (Built)</span>
            {showTotal && (
              <>
                <div className="w-4 h-[1px] border-t border-dashed ml-2" style={{ borderColor: SKU_CONFIG[sku].color }} />
                <span className="text-[#9CA3AF]">Total</span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const val = minVal + (range / 4) * i;
            const y = toY(val);
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F4F5F7" strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-[#9CA3AF]" fontFamily="'IBM Plex Mono', monospace">
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Month labels */}
          {monthLabels.map((m, i) => {
            const x = toX(m.date);
            return (
              <g key={i}>
                <line x1={x} y1={PAD.top} x2={x} y2={H - PAD.bottom} stroke="#F4F5F7" strokeWidth={1} />
                <text x={x} y={H - PAD.bottom + 16} textAnchor="middle" className="text-[9px] fill-[#9CA3AF]" fontFamily="'IBM Plex Mono', monospace">
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          {minVal < 0 && (
            <line x1={PAD.left} y1={toY(0)} x2={W - PAD.right} y2={toY(0)} stroke="#DFE1E6" strokeWidth={1} strokeDasharray="4" />
          )}

          {/* Now line */}
          <line x1={nowX} y1={PAD.top} x2={nowX} y2={H - PAD.bottom} stroke="#DC2626" strokeWidth={1} strokeDasharray="4" />
          <text x={nowX} y={PAD.top - 8} textAnchor="middle" className="text-[9px] fill-[#DC2626]" fontFamily="'IBM Plex Mono', monospace">NOW</text>

          {/* Lines */}
          {skusToShow.map(sku => {
            const pts = projectionData[sku] || [];
            const cfg = SKU_CONFIG[sku];
            return (
              <g key={sku}>
                {showTotal && (
                  <path d={makeStepPath(pts, 'total')} fill="none" stroke={cfg.color} strokeWidth={1.5} strokeDasharray="6 3" opacity={0.5} />
                )}
                <path d={makeStepPath(pts, 'built')} fill="none" stroke={cfg.color} strokeWidth={2.5} />
                {/* Start and end labels */}
                {pts.length > 0 && (
                  <>
                    <text x={toX(pts[0].date) - 4} y={toY(pts[0].built) - 6} textAnchor="end"
                      className="text-[10px] font-bold" fill={cfg.color} fontFamily="'IBM Plex Mono', monospace">
                      {pts[0].built}
                    </text>
                    <text x={toX(pts[pts.length - 1].date) + 4} y={toY(pts[pts.length - 1].built) - 6} textAnchor="start"
                      className="text-[10px] font-bold" fill={cfg.color} fontFamily="'IBM Plex Mono', monospace">
                      {pts[pts.length - 1].built}
                    </text>
                  </>
                )}
                {/* Intermediate step labels */}
                {pts.slice(1, -1).map((p, i) => (
                  <text key={i} x={toX(p.date)} y={toY(p.built) - 6} textAnchor="middle"
                    className="text-[9px]" fill={cfg.color} fontFamily="'IBM Plex Mono', monospace" opacity={0.7}>
                    {p.built}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}