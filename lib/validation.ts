import { deriveAvailabilityState } from "@/lib/portal-state";
import type { OrderFormState, PortalState, ValidationErrors } from "@/lib/types";

export function validateOrderForm(form: OrderFormState, config: PortalState): ValidationErrors {
  const errors: ValidationErrors = {};
  const trimmedName = form.name.trim();
  const state = deriveAvailabilityState(config);

  if (state !== "OPEN") {
    errors.quantity = "PO lagi tutup ya.";
    return errors;
  }

  if (!trimmedName) {
    errors.name = "Isi nama dulu ya.";
  }

  if (!Number.isInteger(form.quantity) || form.quantity < 1) {
    errors.quantity = "Minimal pesan 1 porsi ya.";
  } else if (form.quantity > config.availableStock) {
    errors.quantity = `Melebihi stok (sisa ${config.availableStock}).`;
  }

  if (!form.deliveryMethod) {
    errors.deliveryMethod = "Pilih pengiriman dulu ya.";
  }

  if (form.deliveryMethod !== "pickup" && !form.address.trim()) {
    errors.address = "Alamat perlu diisi untuk pengiriman ini.";
  }

  return errors;
}
