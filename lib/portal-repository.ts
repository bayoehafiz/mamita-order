type PortalStateWritePayload = {
  is_open: boolean;
  available_stock: number;
  product_name: string;
  pack_label: string;
  seller_whatsapp_number: string;
  pickup_enabled: boolean;
  courier_enabled: boolean;
  seller_delivery_enabled: boolean;
  price_label: string;
  announcement_text: string | null;
  updated_by: string | null;
};

export type PortalStateRow = PortalStateWritePayload & {
  id: number;
  updated_at: string | null;
};

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORTAL_STATE_TABLE = process.env.SUPABASE_PORTAL_TABLE || "portal_state";
const PORTAL_STATE_ID = Number.isFinite(Number(process.env.SUPABASE_PORTAL_STATE_ID))
  ? Number(process.env.SUPABASE_PORTAL_STATE_ID)
  : 1;

function requireSupabaseConfig() {
  if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not set");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return {
    baseUrl: `${SUPABASE_URL}/rest/v1/${PORTAL_STATE_TABLE}`,
    serviceKey: SUPABASE_SERVICE_ROLE_KEY
  };
}

function buildHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`
  };
}

function withIdSearchParams() {
  const params = new URLSearchParams();
  params.set("id", `eq.${PORTAL_STATE_ID}`);
  return params;
}

async function fetchWithTimeout(resource: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 5000, ...opts } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function readPortalStateRow(): Promise<PortalStateRow | null> {
  const { baseUrl, serviceKey } = requireSupabaseConfig();
  const params = withIdSearchParams();
  params.set("select", "*");
  params.set("limit", "1");

  const response = await fetchWithTimeout(`${baseUrl}?${params.toString()}`, {
    headers: buildHeaders(serviceKey),
    cache: "no-store",
    timeoutMs: 5000
  });

  if (!response.ok) {
    throw new Error(`Supabase responded with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as PortalStateRow[];

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return payload[0];
}

export async function upsertPortalStateRow(payload: PortalStateWritePayload): Promise<PortalStateRow> {
  const { baseUrl, serviceKey } = requireSupabaseConfig();

  // First, check if the row exists
  const existing = await readPortalStateRow();
  const body = JSON.stringify({
    ...payload,
    updated_at: new Date().toISOString()
  });

  const params = withIdSearchParams();
  params.set("select", "*");

  if (!existing) {
    return insertPortalStateRow(payload);
  }

  const response = await fetchWithTimeout(`${baseUrl}?${params.toString()}`, {
    method: "PATCH",
    headers: {
      ...buildHeaders(serviceKey),
      "Content-Type": "application/json",
      // Force body return even if table preference differs
      Prefer: "return=representation"
    },
    body,
    timeoutMs: 5000
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Unable to update portal state (HTTP ${response.status}) ${text}`.trim());
  }

  const rows = (await response.json()) as PortalStateRow[];
  if (!Array.isArray(rows) || !rows[0]) {
    throw new Error("Supabase update did not return a record");
  }
  return rows[0];
}

async function insertPortalStateRow(payload: PortalStateWritePayload): Promise<PortalStateRow> {
  const { baseUrl, serviceKey } = requireSupabaseConfig();
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      ...buildHeaders(serviceKey),
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      id: PORTAL_STATE_ID,
      ...payload,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error(`Unable to insert portal state (HTTP ${response.status})`);
  }

  const rows = (await response.json()) as PortalStateRow[];

  if (!Array.isArray(rows) || !rows[0]) {
    throw new Error("Supabase insert did not return a record");
  }

  return rows[0];
}

export type PortalStateWriteInput = {
  isOpen: boolean;
  availableStock: number;
  productName: string;
  packLabel: string;
  sellerWhatsappNumber: string;
  pickupEnabled: boolean;
  courierEnabled: boolean;
  sellerDeliveryEnabled: boolean;
  priceLabel: string;
  announcementText?: string;
  updatedBy?: string;
};

export function mapWriteInputToRowPayload(input: PortalStateWriteInput): PortalStateWritePayload {
  const normalizedPhone = String(input.sellerWhatsappNumber || "").replace(/[^\d]/g, "");
  if (!normalizedPhone) {
    throw new Error("sellerWhatsappNumber must contain digits");
  }
  return {
    is_open: input.isOpen,
    available_stock: Math.max(0, Math.floor(input.availableStock)),
    product_name: input.productName.trim(),
    pack_label: input.packLabel.trim(),
    seller_whatsapp_number: normalizedPhone,
    pickup_enabled: input.pickupEnabled,
    courier_enabled: input.courierEnabled,
    seller_delivery_enabled: input.sellerDeliveryEnabled,
    price_label: input.priceLabel.trim(),
    announcement_text: input.announcementText?.trim() || null,
    updated_by: input.updatedBy?.trim() || null
  };
}
