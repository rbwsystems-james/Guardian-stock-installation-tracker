import React, { useState, useEffect } from 'react';
import { SKU_CONFIG, SKU_KEYS } from './constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Info } from 'lucide-react';

const STATUSES = ['Site Survey Scheduled', 'Scheduled', 'Shipped', 'Installed', 'Complete'];

export default function InstallForm({ install, onSave, onCancel, includeComplete = false }) {
  const isEditing = !!install;
  const [form, setForm] = useState({
    site: '', customer: '', address: '', surveyDate: '', postageDate: '', installDate: '',
    units_sc: 0, units_gmu: 0, units_cc: 0, status: 'Scheduled',
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (install) {
      setForm({
        site: install.site || '',
        customer: install.customer || '',
        address: install.address || '',
        surveyDate: install.surveyDate || '',
        postageDate: install.postageDate || '',
        installDate: install.installDate || '',
        units_sc: install.units_sc || 0,
        units_gmu: install.units_gmu || 0,
        units_cc: install.units_cc || 0,
        status: install.status || 'Scheduled',
      });
    }
  }, [install]);

  const isSurvey = form.status === 'Site Survey Scheduled';
  const statuses = includeComplete ? STATUSES : STATUSES.filter(s => s !== 'Complete');

  const validate = () => {
    const errs = [];
    if (!form.site.trim()) errs.push('Site name is required.');
    if (!form.customer.trim()) errs.push('Customer name is required.');
    if (!isSurvey) {
      if (!form.installDate) errs.push('Install date is required.');
      const totalUnits = (form.units_sc || 0) + (form.units_gmu || 0) + (form.units_cc || 0);
      if (totalUnits === 0) errs.push('At least one unit must be > 0.');
    }
    if (form.surveyDate && form.installDate && new Date(form.surveyDate) >= new Date(form.installDate)) {
      errs.push('Survey date must be before install date.');
    }
    if (form.postageDate && form.installDate && new Date(form.postageDate) >= new Date(form.installDate)) {
      errs.push('Dispatch date must be before install date.');
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    const data = { ...form };
    if (isSurvey) {
      data.postageDate = '';
      data.installDate = '';
      data.units_sc = 0;
      data.units_gmu = 0;
      data.units_cc = 0;
    }
    onSave(data);
  };

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className={`bg-white border border-[#DFE1E6] rounded-[10px] overflow-hidden ${!isEditing ? 'border-l-[3px] border-l-[#2563EB]' : ''}`}>
      <div className="p-5 space-y-4">
        {errors.length > 0 && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="text-xs text-[#DC2626] space-y-1">
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <Label className="text-xs text-[#6E7781] mb-1 block">Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Site & Customer */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-[#6E7781] mb-1 block">Site Name *</Label>
            <Input value={form.site} onChange={e => set('site', e.target.value)} placeholder="e.g. Merkur Slots Southend" />
          </div>
          <div>
            <Label className="text-xs text-[#6E7781] mb-1 block">Customer Name *</Label>
            <Input value={form.customer} onChange={e => set('customer', e.target.value)} placeholder="e.g. Merkur UK" />
          </div>
        </div>

        {/* Address */}
        <div>
          <Label className="text-xs text-[#6E7781] mb-1 block">Delivery Address</Label>
          <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-[#6E7781] mb-1 block">Survey Date</Label>
            <Input type="date" value={form.surveyDate} onChange={e => set('surveyDate', e.target.value)} />
          </div>
          {!isSurvey && (
            <>
              <div>
                <Label className="text-xs text-[#6E7781] mb-1 block">Dispatch Date</Label>
                <Input type="date" value={form.postageDate} onChange={e => set('postageDate', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-[#6E7781] mb-1 block">Install Date *</Label>
                <Input type="date" value={form.installDate} onChange={e => set('installDate', e.target.value)} />
              </div>
            </>
          )}
        </div>

        {/* Survey info */}
        {isSurvey && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F5F3FF] border border-[#E9D5FF]">
            <Info className="w-4 h-4 text-[#9333EA] shrink-0" />
            <span className="text-xs text-[#9333EA]">Units and install date confirmed after survey.</span>
          </div>
        )}

        {/* Units */}
        {!isSurvey && (
          <div>
            <Label className="text-xs text-[#6E7781] mb-2 block">Hardware Units</Label>
            <div className="grid grid-cols-3 gap-4">
              {SKU_KEYS.map(sku => (
                <div key={sku}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: SKU_CONFIG[sku].color }} />
                    <span className="text-xs font-medium">{SKU_CONFIG[sku].short}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={form[SKU_CONFIG[sku].field]}
                    onChange={e => set(SKU_CONFIG[sku].field, parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} className="text-[#6E7781]">Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
            {isEditing ? 'Save' : 'Add to Pipeline'}
          </Button>
        </div>
      </div>
    </div>
  );
}