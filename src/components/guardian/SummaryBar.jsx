import React from 'react';
import { SKU_CONFIG, SKU_KEYS, READINESS } from './constants';

export default function SummaryBar({ metrics, installs, supplierOrders }) {
  const { spare, totalInbound, pendingOrders, readiness } = metrics;

  const activeInstalls = installs.filter(i => i.status !== 'Complete' && i.status !== 'Site Survey Scheduled');
  const surveyCount = installs.filter(i => i.status === 'Site Survey Scheduled').length;
  const completedCount = installs.filter(i => i.status === 'Complete').length;

  const readinessValues = Object.entries(readiness)
    .filter(([id]) => {
      const inst = installs.find(i => i.id === id);
      return inst && inst.status !== 'Complete' && inst.status !== 'Site Survey Scheduled';
    })
    .map(([, v]) => v);

  const readyCount = readinessValues.filter(r => r === 'ready').length;
  const partialCount = readinessValues.filter(r => r === 'partial').length;
  const shortCount = readinessValues.filter(r => r === 'short').length;

  const hasShort = shortCount > 0;
  const hasPartial = partialCount > 0;
  const overallStatus = hasShort ? 'SHORT' : hasPartial ? 'PARTIAL' : 'READY';
  const overallColor = hasShort ? '#DC2626' : hasPartial ? '#D97706' : '#059669';
  const overallBg = hasShort ? '#FEF2F2' : hasPartial ? '#FFFBEB' : '#ECFDF5';

  const openOrders = pendingOrders.length;

  const upcomingInstalls = installs
    .filter(i => i.installDate && i.status !== 'Complete' && new Date(i.installDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.installDate) - new Date(b.installDate));
  const nextInstall = upcomingInstalls[0];
  const daysToNext = nextInstall
    ? Math.ceil((new Date(nextInstall.installDate) - new Date(new Date().toDateString())) / 86400000)
    : null;

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] flex divide-x divide-[#DFE1E6]">
      {/* Col 1 - Overall Status */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center min-w-0">
        <div className="px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ background: overallBg, color: overallColor }}>
          {overallStatus}
        </div>
        <div className="mt-2 text-xs text-[#6E7781] text-center space-y-0.5">
          <div>{activeInstalls.length} active install{activeInstalls.length !== 1 ? 's' : ''}</div>
          {surveyCount > 0 && <div style={{ color: '#9333EA' }}>{surveyCount} survey pending</div>}
          {completedCount > 0 && <div style={{ color: '#2563EB' }}>{completedCount} completed</div>}
        </div>
      </div>

      {/* Col 2 - Install Readiness */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center min-w-0">
        <div className="font-mono text-2xl font-bold text-[#1C2024]">
          {readyCount}/{activeInstalls.length}
        </div>
        <div className="mt-1 text-xs space-x-2 flex flex-wrap justify-center gap-1">
          <span style={{ color: '#059669' }}>{readyCount} ready</span>
          <span style={{ color: '#D97706' }}>{partialCount} partial</span>
          <span style={{ color: '#DC2626' }}>{shortCount} short</span>
        </div>
      </div>

      {/* Col 3 - Spare by SKU */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center min-w-0">
        <div className="flex gap-4">
          {SKU_KEYS.map(sku => {
            const val = spare[sku];
            const color = val > 0 ? '#059669' : val === 0 ? '#D97706' : '#DC2626';
            return (
              <div key={sku} className="text-center">
                <div className="font-mono text-xl font-bold" style={{ color }}>{val}</div>
                <div className="text-[9px] font-bold tracking-wider mt-0.5" style={{ color: SKU_CONFIG[sku].color }}>
                  {SKU_CONFIG[sku].short}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-[10px]">
          {SKU_KEYS.some(sku => spare[sku] < 0)
            ? <span className="text-[#DC2626] font-medium">Shortage detected</span>
            : <span className="text-[#6E7781]">all covered</span>
          }
        </div>
      </div>

      {/* Col 4 - Inbound */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center min-w-0">
        <div className="font-mono text-2xl font-bold text-[#1C2024]">{totalInbound}</div>
        <div className="text-xs text-[#6E7781] mt-1">{openOrders} open order{openOrders !== 1 ? 's' : ''}</div>
      </div>

      {/* Col 5 - Next Install */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center min-w-0">
        {daysToNext !== null ? (
          <>
            <div className="font-mono text-2xl font-bold text-[#1C2024]">{daysToNext}<span className="text-base font-normal text-[#6E7781]">d</span></div>
            <div className="text-xs text-[#6E7781] mt-1 text-center truncate max-w-full">{nextInstall.site}</div>
          </>
        ) : (
          <>
            <div className="font-mono text-2xl font-bold text-[#9CA3AF]">—</div>
            <div className="text-xs text-[#9CA3AF] mt-1">No upcoming</div>
          </>
        )}
      </div>
    </div>
  );
}