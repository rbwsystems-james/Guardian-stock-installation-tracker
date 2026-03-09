import React, { useState } from 'react';
import { SKU_CONFIG, SKU_KEYS, READINESS, formatDate } from './constants';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const STATUSES = ['Site Survey Scheduled', 'Scheduled', 'Shipped', 'Installed', 'Complete'];

export default function PipelineTable({ installs, readiness, onStatusChange, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const active = installs
    .filter(i => i.status !== 'Complete')
    .sort((a, b) => new Date(a.installDate || '9999') - new Date(b.installDate || '9999'));
  const completed = installs.filter(i => i.status === 'Complete');

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F8F9FA] transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4 text-[#6E7781]" /> : <ChevronRight className="w-4 h-4 text-[#6E7781]" />}
          <h2 className="text-sm font-semibold text-[#1C2024]">Pipeline Detail</h2>
          <span className="text-xs text-[#6E7781]">{active.length} active · {completed.length} completed</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#DFE1E6] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#DFE1E6]">
                <th className="text-left px-3 py-2 font-medium text-[#6E7781]">Site</th>
                <th className="text-left px-3 py-2 font-medium text-[#6E7781]">Customer</th>
                <th className="text-left px-3 py-2 font-medium text-[#6E7781] font-mono">Survey</th>
                <th className="text-left px-3 py-2 font-medium text-[#6E7781] font-mono">Dispatch</th>
                <th className="text-left px-3 py-2 font-medium text-[#6E7781] font-mono">Install</th>
                <th className="text-center px-2 py-2 font-medium" style={{ color: SKU_CONFIG.sc.color }}>SC</th>
                <th className="text-center px-2 py-2 font-medium" style={{ color: SKU_CONFIG.gmu.color }}>GMU</th>
                <th className="text-center px-2 py-2 font-medium" style={{ color: SKU_CONFIG.cc.color }}>CC</th>
                <th className="text-center px-3 py-2 font-medium text-[#6E7781]">Readiness</th>
                <th className="text-left px-3 py-2 font-medium text-[#6E7781]">Status</th>
                <th className="text-right px-3 py-2 font-medium text-[#6E7781]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map(install => {
                const isSurvey = install.status === 'Site Survey Scheduled';
                const rad = readiness[install.id] || 'survey';
                const radCfg = READINESS[rad];
                return (
                  <tr key={install.id} className="border-b border-[#DFE1E6] hover:bg-[#F8F9FA]">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-[#1C2024]">{install.site}</div>
                      <div className="font-mono text-[9px] text-[#9CA3AF]">{install.id}</div>
                    </td>
                    <td className="px-3 py-2 text-[#6E7781]">{install.customer}</td>
                    <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.surveyDate)}</td>
                    <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.postageDate)}</td>
                    <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.installDate)}</td>
                    <td className="px-2 py-2 text-center font-mono">{isSurvey ? <span className="text-[#9333EA] italic text-[10px]">TBC</span> : (install.units_sc || '—')}</td>
                    <td className="px-2 py-2 text-center font-mono">{isSurvey ? <span className="text-[#9333EA] italic text-[10px]">TBC</span> : (install.units_gmu || '—')}</td>
                    <td className="px-2 py-2 text-center font-mono">{isSurvey ? <span className="text-[#9333EA] italic text-[10px]">TBC</span> : (install.units_cc || '—')}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: radCfg.bg, color: radCfg.color }}>
                        {radCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Select value={install.status} onValueChange={v => onStatusChange(install.id, v)}>
                        <SelectTrigger className="h-7 text-[10px] w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(install)} className="text-[#2563EB] hover:underline text-[10px] font-medium">Edit</button>
                        <button onClick={() => setDeleteTarget(install)} className="text-[#DC2626] hover:underline text-[10px] font-medium ml-2">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Completed section */}
          {completed.length > 0 && (
            <div className="border-t border-[#DFE1E6]">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center gap-2 px-5 py-2 text-xs text-[#6E7781] hover:bg-[#F8F9FA]"
              >
                {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {completed.length} completed install{completed.length !== 1 ? 's' : ''}
                <span className="text-[#2563EB]">{showCompleted ? 'Hide' : 'Show history'}</span>
              </button>

              {showCompleted && (
                <table className="w-full text-xs opacity-70">
                  <tbody>
                    {completed.map(install => (
                      <tr key={install.id} className="border-b border-[#DFE1E6]">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1C2024]">{install.site}</div>
                          <div className="font-mono text-[9px] text-[#9CA3AF]">{install.id}</div>
                        </td>
                        <td className="px-3 py-2 text-[#6E7781]">{install.customer}</td>
                        <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.surveyDate)}</td>
                        <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.postageDate)}</td>
                        <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(install.installDate)}</td>
                        <td className="px-2 py-2 text-center font-mono">{install.units_sc || '—'}</td>
                        <td className="px-2 py-2 text-center font-mono">{install.units_gmu || '—'}</td>
                        <td className="px-2 py-2 text-center font-mono">{install.units_cc || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">Done</span>
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#2563EB]">Complete</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => setDeleteTarget(install)} className="text-[#DC2626] hover:underline text-[10px]">Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}