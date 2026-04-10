import { FALLBACK_PORTAL_STATE } from "@/lib/constants";
import { readPortalStateRow, type PortalStateRow } from "@/lib/portal-repository";
import type { AvailabilityState, PortalState } from "@/lib/types";

function normalizePhone(input: string): string {
  return input.replace(/[^\d]/g, "");
}

export function mapRowToPortalState(row: PortalStateRow): PortalState {
  return {
    isOpen: Boolean(row.is_open),
    availableStock: Math.max(0, Number(row.available_stock) || 0),
    productName: row.product_name || FALLBACK_PORTAL_STATE.productName,
    packLabel: row.pack_label || FALLBACK_PORTAL_STATE.packLabel,
    sellerWhatsappNumber:
      normalizePhone(row.seller_whatsapp_number || FALLBACK_PORTAL_STATE.sellerWhatsappNumber) ||
      FALLBACK_PORTAL_STATE.sellerWhatsappNumber,
    pickupEnabled: Boolean(row.pickup_enabled),
    courierEnabled: Boolean(row.courier_enabled),
    sellerDeliveryEnabled: Boolean(row.seller_delivery_enabled),
    priceLabel: row.price_label || FALLBACK_PORTAL_STATE.priceLabel,
    announcementText: row.announcement_text || undefined,
    updatedAt: row.updated_at || undefined,
    updatedBy: row.updated_by || undefined
  };
}

export function deriveAvailabilityState(config: PortalState): AvailabilityState {
  if (!config.isOpen) {
    return "CLOSED";
  }

  if (config.availableStock <= 0) {
    return "SOLD_OUT";
  }

  return "OPEN";
}

export type PortalStateResult = {
  config: PortalState;
  source: "remote" | "fallback";
  reason?: string;
};

export async function getPortalStateResult(): Promise<PortalStateResult> {
  try {
    const row = await readPortalStateRow();

    if (!row) {
      throw new Error("Supabase does not contain a portal_state row yet");
    }

    const parsed = mapRowToPortalState(row);

    if (!parsed.sellerWhatsappNumber) {
      throw new Error("Portal state is missing seller_whatsapp_number");
    }

    return {
      config: parsed,
      source: "remote"
    };
  } catch (error) {
    return {
      config: FALLBACK_PORTAL_STATE,
      source: "fallback",
      reason: error instanceof Error ? error.message : "Supabase request failed"
    };
  }
}

export async function getPortalState(): Promise<PortalState> {
  const result = await getPortalStateResult();
  return result.config;
}
