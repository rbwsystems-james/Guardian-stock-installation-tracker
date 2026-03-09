import React, { useState, useMemo } from 'react';
import { SKU_CONFIG, SKU_KEYS, STATUS_COLORS, READINESS, formatDateShort } from './constants';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ROW_HEIGHT = 58;
const LEFT_COL = 240;
const DAY_WIDTH = 4;

function getDateRange(installs, supplierOrders) {
  const now = new Date();
  let minDate = new Date(now);
  let maxDate = new Date(now);
  maxDate.setMonth(maxDate.getMonth() + 4);

  const allDates = [];
  installs.forEach(i => {
    if (i.surveyDate) allDates.push(new Date(i.surveyDate));
    if (i.postageDate) allDates.push(new Date(i.postageDate));
    if (i.installDate) allDates.push(new Date(i.installDate));
  });
  (supplierOrders || []).forEach(o => {
    if (o.expectedDate) allDates.push(new Date(o.expectedDate));
  });

  allDates.forEach(d => {
    if (d < minDate) minDate = new Date(d);
    if (d > maxDate) maxDate = new Date(d);
  });

  minDate.setDate(minDate.getDate() - 14);
  maxDate.setDate(maxDate.getDate() + 14);

  return { minDate, maxDate, totalDays: Math.ceil((maxDate - minDate) / 86400000) };
}

function dayOffset(date, minDate) {
  return Math.round((new Date(date) - minDate) / 86400000);
}

export default function GanttTimeline({ installs, supplierOrders, readiness, onRowClick }) {
  const [expanded, setExpanded] = useState(false);

  const { minDate, maxDate, totalDays } = useMemo(() => getDateRange(installs, supplierOrders), [installs, supplierOrders]);
  const chartWidth = totalDays * DAY_WIDTH;
  const now = new Date();
  const todayOffset = dayOffset(now, minDate);

  const pendingOrders = (supplierOrders || []).filter(o => o.status !== 'Delivered');

  const datedInstalls = installs
    .filter(i => i.status !== 'Site Survey Scheduled' && i.status !== 'Complete')
    .sort((a, b) => new Date(a.installDate || '9999') - new Date(b.installDate || '9999'));

  const surveyInstalls = installs.filter(i => i.status === 'Site Survey Scheduled');

  const allRows = [...datedInstalls, ...surveyInstalls];
  const visibleRows = expanded ? allRows : allRows.slice(0, 8);
  const hasMore = allRows.length > 8;

  // Month markers
  const months = useMemo(() => {
    const m = [];
    const d = new Date(minDate);
    d.setDate(1);
    if (d < minDate) d.setMonth(d.getMonth() + 1);
    while (d <= maxDate) {
      m.push({ date: new Date(d), offset: dayOffset(d, minDate) });
      d.setMonth(d.getMonth() + 1);
    }
    return m;
  }, [minDate, maxDate]);

  // Week ticks
  const weeks = useMemo(() => {
    const w = [];
    const d = new Date(minDate);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day)); // next Monday
    while (d <= maxDate) {
      w.push({ date: new Date(d), offset: dayOffset(d, minDate) });
      d.setDate(d.getDate() + 14);
    }
    return w;
  }, [minDate, maxDate]);

  const scheduledCount = datedInstalls.length;
  const surveyCount = surveyInstalls.length;

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DFE1E6]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#1C2024]">Install Timeline</h2>
          <span className="text-xs text-[#6E7781]">{scheduledCount} scheduled · {surveyCount} survey</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#6E7781]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6E7781] inline-block" /> Dispatch</span>
          <span className="flex items-center gap-1"><span className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-[#6E7781] inline-block" /> Install</span>
          <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-[#DC2626] inline-block" /> Today</span>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ maxHeight: expanded && allRows.length > 9 ? '540px' : 'none', overflowY: expanded && allRows.length > 9 ? 'auto' : 'visible' }}>
        <div style={{ minWidth: LEFT_COL + chartWidth + 40 }}>
          {/* Month header */}
          <div className="flex bg-[#F8F9FA] border-b border-[#DFE1E6] text-[10px] text-[#6E7781] h-7">
            <div className="shrink-0 flex items-center px-3 font-medium" style={{ width: LEFT_COL }}>
              <span>Site / Units</span>
            </div>
            <div className="relative flex-1" style={{ width: chartWidth }}>
              {months.map((m, i) => (
                <div key={i} className="absolute top-0 h-full flex items-center font-mono font-medium tracking-wider"
                  style={{ left: m.offset * DAY_WIDTH }}>
                  {m.date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()} {String(m.date.getFullYear()).slice(2)}
                </div>
              ))}
            </div>
          </div>

          {/* Supplier deliveries row */}
          {pendingOrders.length > 0 && (
            <div className="flex border-b border-[#DFE1E6] bg-[#EFF6FF]" style={{ height: 42 }}>
              <div className="shrink-0 flex items-center px-3" style={{ width: LEFT_COL }}>
                <span className="text-[10px] font-bold tracking-wider text-[#2563EB]">SUPPLIER DELIVERIES</span>
                <span className="ml-2 text-[10px] text-[#2563EB]">{pendingOrders.length}</span>
              </div>
              <div className="relative flex-1" style={{ width: chartWidth }}>
                {pendingOrders.map((o, i) => {
                  const off = dayOffset(o.expectedDate, minDate);
                  const cfg = SKU_CONFIG[o.sku];
                  return (
                    <div
                      key={i}
                      className="absolute top-2 px-2 py-0.5 rounded-full bg-white border text-[10px] font-mono whitespace-nowrap flex items-center gap-1 hover:shadow transition-shadow cursor-default"
                      style={{ left: off * DAY_WIDTH - 20, borderColor: cfg.color }}
                      title={`${o.supplier} — ${cfg.short} x${o.qty} — ${formatDateShort(o.expectedDate)}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                      {cfg.short} x{o.qty}
                    </div>
                  );
                })}
                {/* Today line */}
                <div className="absolute top-0 h-full border-l border-dashed border-[#DC2626]" style={{ left: todayOffset * DAY_WIDTH }} />
              </div>
            </div>
          )}

          {/* Install rows */}
          {visibleRows.map((install, idx) => {
            const isSurvey = install.status === 'Site Survey Scheduled';
            const rad = readiness[install.id] || 'survey';
            const radCfg = READINESS[rad];
            const statusCfg = STATUS_COLORS[install.status] || STATUS_COLORS['Scheduled'];
            const showSeparator = idx === datedInstalls.length && surveyInstalls.length > 0 && datedInstalls.length > 0;

            const startDate = install.surveyDate || install.postageDate || install.installDate;
            const endDate = install.installDate;
            const hasDates = startDate && endDate;

            return (
              <React.Fragment key={install.id}>
                {showSeparator && (
                  <div className="flex items-center px-4 py-1.5 bg-[#F5F3FF] border-y border-[#E9D5FF]">
                    <span className="text-[10px] font-bold tracking-wider text-[#9333EA]">PENDING SURVEYS — demand not yet quantified</span>
                  </div>
                )}
                <div
                  className={`flex border-b border-[#DFE1E6] cursor-pointer hover:bg-[#F8F9FA] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFBFC]' : ''}`}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onRowClick(install)}
                >
                  <div className="shrink-0 flex items-center px-3 gap-2" style={{ width: LEFT_COL }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1C2024] truncate">{install.site}</div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {isSurvey ? (
                          <span className="text-[10px] italic text-[#9333EA]">Units TBC</span>
                        ) : (
                          SKU_KEYS.map(sku => {
                            const val = install[SKU_CONFIG[sku].field] || 0;
                            if (val === 0) return null;
                            return (
                              <span key={sku} className="text-[10px] font-mono px-1.5 py-0.5 rounded font-medium"
                                style={{ background: SKU_CONFIG[sku].bg, color: SKU_CONFIG[sku].color }}>
                                {SKU_CONFIG[sku].short} {val}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: radCfg.bg, color: radCfg.color }}>
                      {radCfg.label}
                    </span>
                  </div>

                  <div className="relative flex-1 flex items-center" style={{ width: chartWidth }}>
                    {hasDates ? (() => {
                      const s = dayOffset(startDate, minDate);
                      const e = dayOffset(endDate, minDate);
                      const barLeft = s * DAY_WIDTH;
                      const barWidth = Math.max((e - s) * DAY_WIDTH, 20);
                      return (
                        <>
                          <div className="absolute h-5 rounded flex items-center justify-end pr-2"
                            style={{
                              left: barLeft, width: barWidth,
                              background: statusCfg.bg,
                              border: `1px ${isSurvey ? 'dashed' : 'solid'} ${statusCfg.border}`,
                            }}>
                            <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: statusCfg.text }}>
                              {install.status}
                            </span>
                          </div>
                          {install.postageDate && (
                            <div className="absolute w-2 h-2 rounded-full bg-[#6E7781]"
                              style={{ left: dayOffset(install.postageDate, minDate) * DAY_WIDTH - 4, top: '50%', marginTop: 10 }}
                              title={`Dispatch: ${formatDateShort(install.postageDate)}`} />
                          )}
                          {install.installDate && (
                            <div className="absolute"
                              style={{ left: dayOffset(install.installDate, minDate) * DAY_WIDTH - 5, top: '50%', marginTop: 10 }}
                              title={`Install: ${formatDateShort(install.installDate)}`}>
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[7px] border-transparent border-b-[#1C2024]" />
                            </div>
                          )}
                        </>
                      );
                    })() : (
                      <span className="text-[10px] italic text-[#9333EA] ml-4">Date TBC</span>
                    )}
                    {/* Today line */}
                    <div className="absolute top-0 h-full border-l border-dashed border-[#DC2626]" style={{ left: todayOffset * DAY_WIDTH }} />
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Week ticks */}
          <div className="flex bg-[#F8F9FA] border-t border-[#DFE1E6] h-5 text-[9px] text-[#9CA3AF]">
            <div className="shrink-0" style={{ width: LEFT_COL }} />
            <div className="relative flex-1" style={{ width: chartWidth }}>
              {weeks.map((w, i) => (
                <div key={i} className="absolute font-mono" style={{ left: w.offset * DAY_WIDTH }}>
                  {formatDateShort(w.date.toISOString())}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expand/collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs text-[#2563EB] hover:bg-[#F8F9FA] flex items-center justify-center gap-1 border-t border-[#DFE1E6]"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show all {allRows.length} installs</>}
        </button>
      )}
    </div>
  );
}