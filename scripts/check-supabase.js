// Plain JS runner to avoid tsx IPC issues
require('dotenv/config');

// Import TS via compiled output if available, else transpile-lite using dynamic import
// For simplicity, require the compiled JS if present, else fallback to ts-node-like transpile via next/ts-node is unavailable.
let repo;
try {
  repo = require('../lib/portal-repository');
} catch {
  // Fallback: load TypeScript through dynamic transpile with tsx not allowed; instead, use the emitted JS if Next build exists
  try {
    repo = require('../.next/server/chunks/portal-repository.js');
  } catch (e) {
    throw new Error('Unable to load lib/portal-repository. Run the script with tsx or build first.');
  }
}

function log(step, detail) {
  const t = new Date().toISOString();
  if (typeof detail !== 'undefined') {
    console.log(`[${t}] ${step}:`, detail);
  } else {
    console.log(`[${t}] ${step}`);
  }
}

async function main() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env: ${key}`);
  }

  log('Reading current portal_state row');
  const current = await repo.readPortalStateRow();
  if (!current) throw new Error('portal_state row not found');
  log('Current row', current);

  const toggle = {
    isOpen: !current.is_open,
    availableStock: current.available_stock,
    productName: current.product_name,
    packLabel: current.pack_label,
    sellerWhatsappNumber: current.seller_whatsapp_number,
    pickupEnabled: current.pickup_enabled,
    courierEnabled: current.courier_enabled,
    sellerDeliveryEnabled: current.seller_delivery_enabled,
    priceLabel: current.price_label,
    announcementText: current.announcement_text ?? undefined,
    updatedBy: 'check-supabase'
  };

  log('Toggling is_open');
  const toggled = await repo.upsertPortalStateRow(repo.mapWriteInputToRowPayload(toggle));
  log('Row after toggle', { is_open: toggled.is_open, updated_at: toggled.updated_at, updated_by: toggled.updated_by });

  const revert = { ...toggle, isOpen: current.is_open };
  log('Reverting is_open');
  const reverted = await repo.upsertPortalStateRow(repo.mapWriteInputToRowPayload(revert));
  log('Row after revert', { is_open: reverted.is_open, updated_at: reverted.updated_at, updated_by: reverted.updated_by });

  log('Supabase connectivity verification PASSED');
}

main().catch((err) => {
  console.error('Supabase connectivity verification FAILED');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
