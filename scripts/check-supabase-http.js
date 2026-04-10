// Pure-HTTP Supabase PostgREST verification (no TS imports)
require('dotenv/config');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = process.env.SUPABASE_PORTAL_TABLE || 'portal_state';
const ROW_ID = Number.isFinite(Number(process.env.SUPABASE_PORTAL_STATE_ID))
  ? Number(process.env.SUPABASE_PORTAL_STATE_ID)
  : 1;

function mustEnv(name, val) {
  if (!val) throw new Error(`Missing env: ${name}`);
}

function headers() {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };
}

function log(step, detail) {
  const t = new Date().toISOString();
  if (typeof detail !== 'undefined') console.log(`[${t}] ${step}:`, detail);
  else console.log(`[${t}] ${step}`);
}

async function http(method, url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 5000);
  try {
    const res = await fetch(url, { method, signal: controller.signal, ...opts });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function getRow() {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ROW_ID}&select=*`;
  const res = await http('GET', url, { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`GET failed HTTP ${res.status} ${await res.text().catch(()=>'')}`);
  const data = await res.json();
  return Array.isArray(data) && data[0] ? data[0] : null;
}

async function patchRow(patch) {
  const params = new URLSearchParams();
  params.set('id', `eq.${ROW_ID}`);
  params.set('select', '*');
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?${params.toString()}`;
  const body = JSON.stringify({ ...patch, updated_at: new Date().toISOString() });
  const res = await http('PATCH', url, { headers: headers(), body });
  if (!res.ok) throw new Error(`PATCH failed HTTP ${res.status} ${await res.text().catch(()=>'')}`);
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows[0]) throw new Error('PATCH returned no row');
  return rows[0];
}

async function main() {
  mustEnv('SUPABASE_URL', SUPABASE_URL);
  mustEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE);
  log('Starting Supabase HTTP verification', { table: TABLE, id: ROW_ID });

  const current = await getRow();
  if (!current) throw new Error('portal_state row not found');
  log('Current row', { is_open: current.is_open, updated_at: current.updated_at });

  // Toggle
  const toggled = await patchRow({ is_open: !current.is_open, updated_by: 'check-supabase-http' });
  log('After toggle', { is_open: toggled.is_open, updated_at: toggled.updated_at, updated_by: toggled.updated_by });

  // Revert
  const reverted = await patchRow({ is_open: current.is_open, updated_by: 'check-supabase-http' });
  log('After revert', { is_open: reverted.is_open, updated_at: reverted.updated_at, updated_by: reverted.updated_by });

  log('Supabase connectivity verification PASSED');
}

main().catch(async (err) => {
  console.error('Supabase connectivity verification FAILED');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});

