export type DeliveryAddress = {
  province: string;
  district: string;
  sector: string;
  cell: string;
  address: string;
  landmark: string;
  latitude: string;
  longitude: string;
};

export const DELIVERY_ADDRESS_STORAGE_KEY = "ifix_delivery_address";

export function readSavedDeliveryAddress(): DeliveryAddress | null {
  try {
    const value = sessionStorage.getItem(DELIVERY_ADDRESS_STORAGE_KEY);
    return value ? JSON.parse(value) as DeliveryAddress : null;
  } catch {
    return null;
  }
}
