// src/api/base44Client.js
// Drop-in replacement — routes base44.entities.* calls to Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Field Mapping ──────────────────────────────────────────────────────────

const toSnake = (obj) => {
  const map = {
    surveyDate: 'survey_date',
    postageDate: 'postage_date',
    installDate: 'install_date',
    unitsSc: 'units_sc',
    units_sc: 'units_sc',
    unitsGmu: 'units_gmu',
    units_gmu: 'units_gmu',
    unitsCc: 'units_cc',
    units_cc: 'units_cc',
    orderDate: 'order_date',
    expectedDate: 'expected_date',
    poRef: 'po_ref',
    delivered_applied: 'delivered_applied',
    deliveredApplied: 'delivered_applied',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = map[key] || key;
    result[snakeKey] = value;
  }
  return result;
};

const toCamel = (obj) => {
  const map = {
    survey_date: 'surveyDate',
    postage_date: 'postageDate',
    install_date: 'installDate',
    units_sc: 'units_sc',
    units_gmu: 'units_gmu',
    units_cc: 'units_cc',
    order_date: 'orderDate',
    expected_date: 'expectedDate',
    po_ref: 'poRef',
    delivered_applied: 'delivered_applied',
    created_at: 'created_at',
    updated_at: 'updated_at',
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = map[key] || key;
    result[camelKey] = value;
  }
  return result;
};

// ─── Entity Wrapper ─────────────────────────────────────────────────────────

function createEntity(tableName) {
  return {
    async list(filters = {}) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(toCamel);
    },

    async create(record) {
      const snaked = toSnake(record);
      delete snaked.id;
      delete snaked.created_at;
      delete snaked.updated_at;
      const { data, error } = await supabase.from(tableName).insert(snaked).select().single();
      if (error) throw error;
      return toCamel(data);
    },

    async bulkCreate(records) {
      const snaked = records.map(r => {
        const s = toSnake(r);
        delete s.id;
        delete s.created_at;
        delete s.updated_at;
        return s;
      });
      const { data, error } = await supabase.from(tableName).insert(snaked).select();
      if (error) throw error;
      return (data || []).map(toCamel);
    },

    async update(id, updates) {
      const snaked = toSnake(updates);
      delete snaked.id;
      delete snaked.created_at;
      const { data, error } = await supabase.from(tableName).update(snaked).eq('id', id).select().single();
      if (error) throw error;
      return toCamel(data);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}

// ─── Exported Client ────────────────────────────────────────────────────────

export const base44 = {
  entities: {
    StockLevel: createEntity('stock_levels'),
    Install: createEntity('installs'),
    SupplierOrder: createEntity('supplier_orders'),
  },
};