export const SKU_CONFIG = {
  sc: { label: 'Site Controller', short: 'SC', color: '#2563EB', bg: '#EFF6FF', field: 'units_sc' },
  gmu: { label: 'GMUs', short: 'GMU', color: '#D97706', bg: '#FFFBEB', field: 'units_gmu' },
  cc: { label: 'Coin Counter Units', short: 'CC', color: '#7C3AED', bg: '#F5F3FF', field: 'units_cc' },
};

export const SKU_KEYS = ['sc', 'gmu', 'cc'];

export const STATUS_COLORS = {
  'Site Survey Scheduled': { bg: '#F5F3FF', text: '#9333EA', border: '#9333EA' },
  'Scheduled': { bg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF' },
  'Shipped': { bg: '#FFFBEB', text: '#D97706', border: '#D97706' },
  'Installed': { bg: '#ECFDF5', text: '#059669', border: '#059669' },
  'Complete': { bg: '#EFF6FF', text: '#2563EB', border: '#2563EB' },
};

export const READINESS = {
  ready: { label: 'Ready', color: '#059669', bg: '#ECFDF5' },
  partial: { label: 'Partial', color: '#D97706', bg: '#FFFBEB' },
  short: { label: 'Short', color: '#DC2626', bg: '#FEF2F2' },
  survey: { label: 'Survey', color: '#9333EA', bg: '#F5F3FF' },
  done: { label: 'Done', color: '#2563EB', bg: '#EFF6FF' },
};

export function computeMetrics(stockLevels, installs, supplierOrders) {
  const stock = {};
  SKU_KEYS.forEach(sku => {
    const sl = stockLevels.find(s => s.sku === sku);
    stock[sku] = { total: sl?.total || 0, built: sl?.built || 0 };
  });

  const committed = { sc: 0, gmu: 0, cc: 0 };
  const activeInstalls = installs.filter(i => i.status !== 'Complete' && i.status !== 'Site Survey Scheduled');
  activeInstalls.forEach(i => {
    committed.sc += i.units_sc || 0;
    committed.gmu += i.units_gmu || 0;
    committed.cc += i.units_cc || 0;
  });

  const spare = {};
  SKU_KEYS.forEach(sku => {
    spare[sku] = stock[sku].built - committed[sku];
  });

  const pendingOrders = (supplierOrders || []).filter(o => o.status !== 'Delivered');
  const inbound = {};
  SKU_KEYS.forEach(sku => { inbound[sku] = 0; });
  pendingOrders.forEach(o => { inbound[o.sku] = (inbound[o.sku] || 0) + (o.qty || 0); });
  const totalInbound = Object.values(inbound).reduce((a, b) => a + b, 0);

  // Readiness per install
  const readiness = computeReadiness(installs, stock);

  return { stock, committed, spare, inbound, totalInbound, pendingOrders, readiness };
}

export function computeReadiness(installs, stock) {
  const result = {};
  const remaining = {};
  SKU_KEYS.forEach(sku => { remaining[sku] = stock[sku]?.built || 0; });

  // Sort active installs by installDate
  const dated = installs
    .filter(i => i.status !== 'Complete' && i.status !== 'Site Survey Scheduled')
    .sort((a, b) => {
      const da = a.installDate ? new Date(a.installDate) : new Date('9999-12-31');
      const db = b.installDate ? new Date(b.installDate) : new Date('9999-12-31');
      return da - db;
    });

  dated.forEach(install => {
    const needs = {
      sc: install.units_sc || 0,
      gmu: install.units_gmu || 0,
      cc: install.units_cc || 0,
    };
    let fulfilled = 0;
    let total = 0;
    let anyZero = false;

    SKU_KEYS.forEach(sku => {
      if (needs[sku] > 0) {
        total++;
        if (remaining[sku] >= needs[sku]) {
          fulfilled++;
        } else if (remaining[sku] <= 0) {
          anyZero = true;
        }
      }
    });

    if (total === 0) {
      result[install.id] = 'ready';
    } else if (fulfilled === total) {
      result[install.id] = 'ready';
    } else if (anyZero && fulfilled === 0) {
      result[install.id] = 'short';
    } else {
      result[install.id] = 'partial';
    }

    // Deduct
    SKU_KEYS.forEach(sku => {
      remaining[sku] -= needs[sku] || 0;
    });
  });

  // Survey and complete
  installs.forEach(i => {
    if (i.status === 'Site Survey Scheduled') result[i.id] = 'survey';
    if (i.status === 'Complete') result[i.id] = 'done';
  });

  return result;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}