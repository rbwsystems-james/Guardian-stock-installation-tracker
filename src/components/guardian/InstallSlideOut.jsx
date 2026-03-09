import React from 'react';
import { X } from 'lucide-react';
import InstallForm from './InstallForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallSlideOut({ install, onSave, onClose }) {
  if (!install) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-[420px] h-full bg-white border-l border-[#DFE1E6] shadow-xl overflow-y-auto z-10"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6]">
            <h3 className="text-sm font-semibold text-[#1C2024]">Edit Installation</h3>
            <button onClick={onClose} className="p-1 hover:bg-[#F4F5F7] rounded">
              <X className="w-4 h-4 text-[#6E7781]" />
            </button>
          </div>
          <div className="p-0">
            <InstallForm
              install={install}
              onSave={(data) => { onSave(install.id, data); onClose(); }}
              onCancel={onClose}
              includeComplete
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}