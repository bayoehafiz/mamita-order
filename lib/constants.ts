import type { DeliveryMethod, PortalState } from "@/lib/types";

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: "Ambil Sendiri",
  courier: "Grab / Gojek",
  seller_delivery: "Diantar Penjual"
};

export const FALLBACK_PORTAL_STATE: PortalState = {
  isOpen: false,
  availableStock: 0,
  productName: "Martabak Bihun Mamita",
  packLabel: "1 pack isi 5 pcs",
  sellerWhatsappNumber: "6281249940606",
  pickupEnabled: true,
  courierEnabled: true,
  sellerDeliveryEnabled: true,
  priceLabel: "Harga dikonfirmasi via WA",
  announcementText: "PO sedang ditutup sebentar ya. Bisa chat Mamita untuk tanya jadwal berikutnya!"
};
