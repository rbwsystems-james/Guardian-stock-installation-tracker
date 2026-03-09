import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeMetrics, SKU_KEYS } from '../components/guardian/constants';
import SummaryBar from '../components/guardian/SummaryBar';
import InventoryPanel from '../components/guardian/InventoryPanel';
import InstallForm from '../components/guardian/InstallForm';
import InstallSlideOut from '../components/guardian/InstallSlideOut';
import GanttTimeline from '../components/guardian/GanttTimeline';
import StockProjectionChart from '../components/guardian/StockProjectionChart';
import PipelineTable from '../components/guardian/PipelineTable';
import SupplierOrdersTab from '../components/guardian/SupplierOrdersTab';

const DEFAULT_STOCK = [
  { sku: 'sc', label: 'Site Controller', short: 'SC', total: 0, built: 0 },
  { sku: 'gmu', label: 'GMUs', short: 'GMU', total: 0, built: 0 },
  { sku: 'cc', label: 'Coin Counter Units', short: 'CC', total: 0, built: 0 },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('operations');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editInstall, setEditInstall] = useState(null);
  const queryClient = useQueryClient();

  // Data queries
  const { data: stockLevels = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stockLevels'],
    queryFn: () => base44.entities.StockLevel.list(),
  });

  const { data: installs = [] } = useQuery({
    queryKey: ['installs'],
    queryFn: () => base44.entities.Install.list(),
  });

  const { data: supplierOrders = [] } = useQuery({
    queryKey: ['supplierOrders'],
    queryFn: () => base44.entities.SupplierOrder.list(),
  });

  // Auto-create stock levels if empty
  useEffect(() => {
    if (!stockLoading && stockLevels.length === 0) {
      const init = async () => {
        await base44.entities.StockLevel.bulkCreate(DEFAULT_STOCK);
        queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      };
      init();
    }
  }, [stockLoading, stockLevels.length]);

  const metrics = useMemo(() => computeMetrics(stockLevels, installs, supplierOrders), [stockLevels, installs, supplierOrders]);

  // Mutations
  const updateStock = useMutation({
    mutationFn: ({ sku, data }) => {
      const sl = stockLevels.find(s => s.sku === sku);
      if (sl) return base44.entities.StockLevel.update(sl.id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stockLevels'] }),
  });

  const createInstall = useMutation({
    mutationFn: (data) => base44.entities.Install.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['installs'] }); setShowAddForm(false); },
  });

  const updateInstall = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Install.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['installs'] }),
  });

  const deleteInstall = useMutation({
    mutationFn: (id) => base44.entities.Install.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['installs'] }),
  });

  const createOrder = useMutation({
    mutationFn: (data) => base44.entities.SupplierOrder.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplierOrders'] }),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ order, newStatus }) => {
      await base44.entities.SupplierOrder.update(order.id, { status: newStatus });
      // If delivered and not already applied, increment stock
      if (newStatus === 'Delivered' && !order.delivered_applied) {
        const sl = stockLevels.find(s => s.sku === order.sku);
        if (sl) {
          await base44.entities.StockLevel.update(sl.id, { total: sl.total + order.qty });
          await base44.entities.SupplierOrder.update(order.id, { delivered_applied: true });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierOrders'] });
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: (id) => base44.entities.SupplierOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplierOrders'] }),
  });

  const handleUpdateStock = useCallback((sku, data) => {
    updateStock.mutate({ sku, data });
  }, [updateStock]);

  const handleStatusChange = useCallback((id, status) => {
    updateInstall.mutate({ id, data: { status } });
  }, [updateInstall]);

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="min-h-screen bg-[#F4F5F7]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <header className="bg-white border-b border-[#DFE1E6] sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1C2024] rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-mono font-bold tracking-tight">GS</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#1C2024] leading-tight">Guardian Stock & Installation Tracker</h1>
              <p className="text-[10px] text-[#9CA3AF]">Hardware Inventory & Install Pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#6E7781]">{dateStr}</span>
            {activeTab === 'operations' && !showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8">
                <Plus className="w-3 h-3 mr-1" /> Add Install
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-5 py-5 space-y-4">
        {/* Summary Bar */}
        <SummaryBar metrics={metrics} installs={installs} supplierOrders={supplierOrders} />

        {/* Tabs */}
        <div className="flex border-b border-[#DFE1E6]">
          {[
            { key: 'operations', label: 'Operations' },
            { key: 'suppliers', label: 'Supplier Orders' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-[#2563EB]'
                  : 'text-[#6E7781] hover:text-[#1C2024]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
              )}
            </button>
          ))}
        </div>

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="space-y-4">
            <InventoryPanel stockLevels={stockLevels} metrics={metrics} onUpdateStock={handleUpdateStock} />

            {showAddForm && (
              <InstallForm
                onSave={(data) => createInstall.mutate(data)}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            <GanttTimeline
              installs={installs}
              supplierOrders={supplierOrders}
              readiness={metrics.readiness}
              onRowClick={setEditInstall}
            />

            <StockProjectionChart stockLevels={stockLevels} installs={installs} supplierOrders={supplierOrders} />

            <PipelineTable
              installs={installs}
              readiness={metrics.readiness}
              onStatusChange={handleStatusChange}
              onEdit={setEditInstall}
              onDelete={(id) => deleteInstall.mutate(id)}
            />
          </div>
        )}

        {/* Supplier Orders Tab */}
        {activeTab === 'suppliers' && (
          <SupplierOrdersTab
            orders={supplierOrders}
            onAddOrder={(data) => createOrder.mutate(data)}
            onUpdateStatus={(order, newStatus) => updateOrderStatus.mutate({ order, newStatus })}
            onDeleteOrder={(id) => deleteOrder.mutate(id)}
          />
        )}
      </main>

      {/* Slide-out edit panel */}
      <InstallSlideOut
        install={editInstall}
        onSave={(id, data) => updateInstall.mutate({ id, data })}
        onClose={() => setEditInstall(null)}
      />
    </div>
  );
}