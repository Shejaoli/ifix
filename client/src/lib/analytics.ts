type Payload = Record<string, string | number | boolean | null | undefined>;

export function track(eventName: string, payload: Payload = {}) {
  console.log(`[Analytics] ${eventName}`, payload);

  // Replace window.gtag call below with your real analytics provider:
  // if (typeof (window as any).gtag === "function") {
  //   (window as any).gtag("event", eventName, payload);
  // }

  // Replace below with Segment, Mixpanel, or PostHog if needed:
  // if (typeof (window as any).analytics?.track === "function") {
  //   (window as any).analytics.track(eventName, payload);
  // }
}

export const Events = {
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  START_CHECKOUT: "start_checkout",
  COMPLETE_CHECKOUT: "complete_checkout",
  ENQUIRE_WHATSAPP: "enquire_whatsapp",
  ENQUIRE_EMAIL: "enquire_email",
  FILTER_APPLIED: "filter_applied",
  SEARCH: "search",
} as const;
