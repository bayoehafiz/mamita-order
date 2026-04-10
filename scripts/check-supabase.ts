/*
  Verification script for Supabase connectivity and CRUD round-trip.
  Usage: npm run check:supabase
*/
import 'dotenv/config';

import { readPortalStateRow, upsertPortalStateRow, mapWriteInputToRowPayload, type PortalStateWriteInput } from '@/lib/portal-repository';

function log(step: string, detail?: unknown) {
  const t = new Date().toISOString();
  if (detail !== undefined) {
    console.log(`[${t}] ${step}:`, detail);
  } else {
    console.log(`[${t}] ${step}`);
  }
}

async function main() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env: ${key}`);
    }
  }

  log('Reading current portal_state row');
  const current = await readPortalStateRow();
  if (!current) {
    throw new Error('portal_state row not found (id from SUPABASE_PORTAL_STATE_ID)');
  }
  log('Current row', current);

  // Prepare a no-op-ish update: toggle is_open and revert
  const toggle: PortalStateWriteInput = {
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
  const toggled = await upsertPortalStateRow(mapWriteInputToRowPayload(toggle));
  log('Row after toggle', { is_open: toggled.is_open, updated_at: toggled.updated_at, updated_by: toggled.updated_by });

  // Revert
  const revert: PortalStateWriteInput = { ...toggle, isOpen: current.is_open };
  log('Reverting is_open');
  const reverted = await upsertPortalStateRow(mapWriteInputToRowPayload(revert));
  log('Row after revert', { is_open: reverted.is_open, updated_at: reverted.updated_at, updated_by: reverted.updated_by });

  log('Supabase connectivity verification PASSED');
}

main().catch((err) => {
  console.error('Supabase connectivity verification FAILED');
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});

