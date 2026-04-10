export type DeliveryMethod = "pickup" | "courier" | "seller_delivery";

export type AvailabilityState = "OPEN" | "CLOSED" | "SOLD_OUT";

export type PortalState = {
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
  updatedAt?: string;
  updatedBy?: string;
};

export type OrderFormState = {
  name: string;
  quantity: number;
  deliveryMethod: DeliveryMethod | "";
  address: string;
};

export type ValidationErrors = Partial<Record<keyof OrderFormState, string>>;
