import React from 'react';
import { Button } from '@/components/ui/button';

export default function DeleteConfirmDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-[10px] border border-[#DFE1E6] p-6 max-w-sm w-full mx-4 shadow-lg">
        <h3 className="text-sm font-semibold text-[#1C2024] mb-2">Delete this installation?</h3>
        <p className="text-xs text-[#6E7781] mb-5">This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} className="text-[#6E7781] text-xs">Cancel</Button>
          <Button onClick={onConfirm} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs">Confirm</Button>
        </div>
      </div>
    </div>
  );
}