const ORDER_SOURCE_KEY = "ifix_order_source";

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  store: "Store",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  facebook: "Facebook",
};

function normalizeSource(value: string | null | undefined): string | null {
  if (!value) return null;
  return SOURCE_LABELS[value.trim().toLowerCase()] || null;
}

/** Remember an allowed campaign source as customers browse from an ad to checkout. */
export function captureOrderSourceFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const source = normalizeSource(params.get("utm_source") || params.get("source"));
  if (source) window.sessionStorage.setItem(ORDER_SOURCE_KEY, source);
}

/** Return the recorded campaign channel, or Website when there is no attribution. */
export function getOrderSource(): string {
  if (typeof window === "undefined") return "Website";
  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalizeSource(params.get("utm_source") || params.get("source"));
  if (fromUrl) return fromUrl;
  return normalizeSource(window.sessionStorage.getItem(ORDER_SOURCE_KEY)) || "Website";
}
