// Cloud storage backed by Supabase — syncs across all your devices.
// Falls back to localStorage if the cloud isn't configured yet.
import { createClient } from '@supabase/supabase-js';

// These come from your Vercel environment variables (set during deploy).
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A single shared bucket id so all your devices read/write the same data.
// (Single-user app: everything lives under one row per key.)
const supabase = (URL && KEY) ? createClient(URL, KEY) : null;

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); }
  catch (e) { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
function lsDel(key) { try { localStorage.removeItem(key); } catch (e) {} }

export function cloudReady() { return !!supabase; }

export async function sget(key) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('kv').select('value').eq('k', key).maybeSingle();
      if (!error && data && data.value != null) {
        lsSet(key, data.value);
        return data.value;
      }
    } catch (e) {}
  }
  return lsGet(key);
}

export async function sset(key, val) {
  lsSet(key, val);
  if (supabase) {
    try {
      await supabase.from('kv').upsert({ k: key, value: val }, { onConflict: 'k' });
    } catch (e) {}
  }
  return true;
}

export async function sdel(key) {
  lsDel(key);
  if (supabase) {
    try { await supabase.from('kv').delete().eq('k', key); } catch (e) {}
  }
}

export function storageMode() { return supabase ? 'cloud (synced)' : 'local only'; }
