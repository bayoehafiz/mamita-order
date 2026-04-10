import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mapRowToPortalState } from "@/lib/portal-state";
import {
  mapWriteInputToRowPayload,
  readPortalStateRow,
  upsertPortalStateRow,
  type PortalStateWriteInput
} from "@/lib/portal-repository";

export async function GET() {
  try {
    const row = await readPortalStateRow();

    if (!row) {
      return NextResponse.json(
        { error: "Portal state record has not been created yet." },
        { status: 404 }
      );
    }

    return NextResponse.json(mapRowToPortalState(row));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load portal state." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const normalized = normalizeAdminPayload(payload);
    const updated = await upsertPortalStateRow(mapWriteInputToRowPayload(normalized));
    revalidatePath("/");
    return NextResponse.json(mapRowToPortalState(updated));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update portal state." },
      { status: 400 }
    );
  }
}

function normalizeAdminPayload(payload: unknown): PortalStateWriteInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload submitted.");
  }

  const record = payload as Record<string, unknown>;

  const isOpen = expectBoolean(record.isOpen, "isOpen");
  const pickupEnabled = expectBoolean(record.pickupEnabled, "pickupEnabled");
  const courierEnabled = expectBoolean(record.courierEnabled, "courierEnabled");
  const sellerDeliveryEnabled = expectBoolean(record.sellerDeliveryEnabled, "sellerDeliveryEnabled");

  const availableStock = clampToNonNegativeInteger(expectNumber(record.availableStock, "availableStock"));
  const productName = expectFilledString(record.productName, "productName");
  const packLabel = expectFilledString(record.packLabel, "packLabel");
  const priceLabel = expectFilledString(record.priceLabel, "priceLabel");
  const sellerWhatsappNumber = sanitizePhone(expectFilledString(record.sellerWhatsappNumber, "sellerWhatsappNumber"));

  if (!sellerWhatsappNumber) {
    throw new Error("sellerWhatsappNumber must contain at least one digit.");
  }

  const announcementText = typeof record.announcementText === "string" ? record.announcementText : undefined;
  const updatedBy = typeof record.updatedBy === "string" ? record.updatedBy : undefined;

  return {
    isOpen,
    availableStock,
    productName,
    packLabel,
    sellerWhatsappNumber,
    pickupEnabled,
    courierEnabled,
    sellerDeliveryEnabled,
    priceLabel,
    announcementText,
    updatedBy
  };
}

function expectBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean.`);
  }

  return value;
}

function expectNumber(value: unknown, field: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a valid number.`);
  }

  return parsed;
}

function expectFilledString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${field} cannot be empty.`);
  }

  return trimmed;
}

function sanitizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function clampToNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}
