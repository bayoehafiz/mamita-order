import { DELIVERY_LABELS } from "@/lib/constants";
import { parsePriceFromLabel, formatRupiah } from "@/lib/utils";
import type { DeliveryMethod, OrderFormState, PortalState } from "@/lib/types";

export function buildWhatsAppMessage(form: OrderFormState, config: PortalState): string {
  const deliveryMethod = form.deliveryMethod as DeliveryMethod;
  const unitPrice = parsePriceFromLabel(config.priceLabel);
  const totalStr = unitPrice ? formatRupiah(unitPrice * form.quantity) : "";

  const lines = [
    `Halo Mamita! Saya mau ikut PO ${config.productName} ya Mom:`,
    `Nama: ${form.name.trim()}`,
    `Jumlah: ${form.quantity} Porsi`,
    `Pengiriman: ${DELIVERY_LABELS[deliveryMethod]}`,
  ];

  if (deliveryMethod !== "pickup" && form.address.trim()) {
    lines.push(`Alamat: ${form.address.trim()}`);
  }

  lines.push("");

  if (totalStr) {
    if (deliveryMethod === "pickup") {
      lines.push(`Total Pesanan: *${totalStr}*`);
      lines.push("Boleh info rekening transfernya ya Mom. Makasih!");
    } else {
      lines.push(`Total Sementara (belum ongkir): *${totalStr}*`);
      lines.push("Boleh info total + ongkir dan rekening transfernya ya Mom. Makasih!");
    }
  } else {
    // Fallback if price formulation failed
    lines.push("Boleh info total dan rekening transfernya ya Mom. Makasih!");
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
