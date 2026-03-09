import React, { useState } from 'react';
import { SKU_CONFIG, SKU_KEYS, formatDate } from './constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const ORDER_STATUSES = ['Ordered', 'In Transit', 'Delivered'];

export default function SupplierOrdersTab({ orders, onAddOrder, onUpdateStatus, onDeleteOrder }) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ supplier: '', sku: 'gmu', qty: '', orderDate: '', expectedDate: '', poRef: '', cost: '' });
  const [errors, setErrors] = useState([]);
  const [deliveredFlash, setDeliveredFlash] = useState(null);

  const pendingOrders = orders.filter(o => o.status !== 'Delivered');
  const totalInbound = pendingOrders.reduce((s, o) => s + (o.qty || 0), 0);
  const outstandingCost = pendingOrders.reduce((s, o) => s + (o.cost || 0), 0);

  const handleAdd = () => {
    const errs = [];
    if (!form.supplier.trim()) errs.push('Supplier is required.');
    if (!form.qty || parseInt(form.qty) < 1) errs.push('Quantity must be at least 1.');
    if (!form.expectedDate) errs.push('Expected delivery date is required.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    onAddOrder({
      supplier: form.supplier,
      sku: form.sku,
      qty: parseInt(form.qty),
      orderDate: form.orderDate || undefined,
      expectedDate: form.expectedDate,
      poRef: form.poRef || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      status: 'Ordered',
    });
    setForm({ supplier: '', sku: 'gmu', qty: '', orderDate: '', expectedDate: '', poRef: '', cost: '' });
    setShowForm(false);
  };

  const handleStatusChange = (order, newStatus) => {
    onUpdateStatus(order, newStatus);
    if (newStatus === 'Delivered') {
      setDeliveredFlash(order.id);
      setTimeout(() => setDeliveredFlash(null), 2000);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#DFE1E6]">
        <div>
          <h2 className="text-sm font-semibold text-[#1C2024]">Supplier Orders</h2>
          <p className="text-[10px] text-[#6E7781]">{totalInbound} units inbound · £{outstandingCost.toLocaleString()} outstanding</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8"
        >
          <Plus className="w-3 h-3 mr-1" /> New Order
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-[#DFE1E6] bg-[#F8F9FA]">
          {errors.length > 0 && (
            <div className="mb-3 p-2 bg-[#FEF2F2] border border-[#FECACA] rounded flex gap-2">
              <AlertCircle className="w-3 h-3 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="text-[10px] text-[#DC2626]">
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px] text-[#6E7781]">Supplier *</Label>
              <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">SKU</Label>
              <Select value={form.sku} onValueChange={v => setForm(f => ({ ...f, sku: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKU_KEYS.map(s => <SelectItem key={s} value={s}>{SKU_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">Quantity *</Label>
              <Input type="number" min={1} value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} className="h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">Order Date</Label>
              <Input type="date" value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} className="h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">Expected Delivery *</Label>
              <Input type="date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} className="h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">PO Reference</Label>
              <Input value={form.poRef} onChange={e => setForm(f => ({ ...f, poRef: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] text-[#6E7781]">Cost (£)</Label>
              <Input type="number" min={0} step={0.01} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="h-8 text-xs font-mono" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-xs text-[#6E7781]">Cancel</Button>
            <Button onClick={handleAdd} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs">Add</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#DFE1E6]">
              <th className="text-left px-3 py-2 font-medium text-[#6E7781]">PO Ref</th>
              <th className="text-left px-3 py-2 font-medium text-[#6E7781]">Supplier</th>
              <th className="text-left px-3 py-2 font-medium text-[#6E7781]">SKU</th>
              <th className="text-center px-3 py-2 font-medium text-[#6E7781]">Qty</th>
              <th className="text-left px-3 py-2 font-medium text-[#6E7781] font-mono">Ordered</th>
              <th className="text-left px-3 py-2 font-medium text-[#6E7781] font-mono">Expected</th>
              <th className="text-right px-3 py-2 font-medium text-[#6E7781]">Cost</th>
              <th className="text-left px-3 py-2 font-medium text-[#6E7781]">Status</th>
              <th className="text-right px-3 py-2 font-medium text-[#6E7781]"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-[#9CA3AF]">No supplier orders yet</td></tr>
            )}
            {orders.map(order => {
              const cfg = SKU_CONFIG[order.sku];
              const isOverdue = order.status !== 'Delivered' && order.expectedDate && order.expectedDate < today;
              const isFlashing = deliveredFlash === order.id;
              return (
                <tr key={order.id}
                  className={`border-b border-[#DFE1E6] transition-colors ${isOverdue ? 'bg-[#FEF2F2]' : ''} ${isFlashing ? 'bg-[#ECFDF5]' : ''}`}>
                  <td className="px-3 py-2 font-mono text-[#6E7781]">{order.poRef || '—'}</td>
                  <td className="px-3 py-2 text-[#1C2024] font-medium">{order.supplier}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-medium"
                      style={{ background: cfg?.bg, color: cfg?.color }}>
                      {cfg?.short}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono font-bold">{order.qty}</td>
                  <td className="px-3 py-2 font-mono text-[#6E7781]">{formatDate(order.orderDate)}</td>
                  <td className="px-3 py-2 font-mono">
                    <span className={isOverdue ? 'text-[#DC2626]' : 'text-[#6E7781]'}>
                      {formatDate(order.expectedDate)}
                    </span>
                    {isOverdue && <span className="ml-1 text-[9px] font-bold text-[#DC2626] bg-[#FEE2E2] px-1 py-0.5 rounded">OVERDUE</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#6E7781]">
                    {order.cost ? `£${order.cost.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Select value={order.status} onValueChange={v => handleStatusChange(order, v)}>
                      <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setDeleteTarget(order)} className="text-[#DC2626] hover:underline text-[10px]">Del</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { onDeleteOrder(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}