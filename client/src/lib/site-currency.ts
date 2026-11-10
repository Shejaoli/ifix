import { queryClient } from "@/lib/queryClient";

export type SiteCurrency = { currency: string; rwfPerUnit: string };

const DEFAULT_CURRENCY: SiteCurrency = { currency: "RWF", rwfPerUnit: "1" };
export const SUPPORTED_CURRENCIES = [
  { code: "RWF", name: "Rwandan Franc" }, { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" }, { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" }, { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" }, { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" }, { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" }, { code: "INR", name: "Indian Rupee" },
  { code: "AED", name: "UAE Dirham" }, { code: "ZAR", name: "South African Rand" },
] as const;

export function getSiteCurrency(): SiteCurrency {
  return queryClient.getQueryData<SiteCurrency>(["/api/site-currency"]) ?? DEFAULT_CURRENCY;
}

export function displayPriceToRwf(displayAmount: number): number {
  const { currency, rwfPerUnit } = getSiteCurrency();
  return currency === "RWF" ? displayAmount : displayAmount * Number(rwfPerUnit || 1);
}

export function rwfToDisplayPrice(rwfAmount: number): number {
  const { currency, rwfPerUnit } = getSiteCurrency();
  return currency === "RWF" ? rwfAmount : rwfAmount / Number(rwfPerUnit || 1);
}

export function formatSiteCurrency(rwfAmount: number): string {
  const { currency, rwfPerUnit } = getSiteCurrency();
  const converted = currency === "RWF" ? rwfAmount : rwfAmount / Number(rwfPerUnit || 1);
  try {
    return new Intl.NumberFormat(currency === "RWF" ? "en-RW" : "en", {
      style: "currency", currency, maximumFractionDigits: currency === "RWF" ? 0 : 2,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}
