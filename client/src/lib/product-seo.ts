const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  smartphones: "smartphone",
  laptops: "laptop",
  tablets: "tablet",
  "phones accessories": "phone accessory",
  "laptop accessories": "laptop accessory",
  "gaming accessories": "gaming accessory",
  smartwatches: "smartwatch",
  cameras: "camera",
  "camera accessories": "camera accessory",
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  smartphones: ["smartphone", "mobile phone", "iphone", "galaxy", "pixel", "redmi", "oneplus", "tecno", "infinix"],
  laptops: ["laptop", "macbook", "thinkpad", "notebook", "chromebook", "vivobook", "ideapad", "pavilion"],
  tablets: ["tablet", "ipad", "galaxy tab"],
  "phones accessories": ["accessory", "case", "charger", "screen protector", "phone", "iphone"],
  "laptop accessories": ["accessory", "laptop", "notebook", "charger"],
  "gaming accessories": ["gaming", "controller", "headset", "keyboard", "mouse", "gamepad"],
  smartwatches: ["smartwatch", "apple watch", "galaxy watch"],
  cameras: ["camera", "gopro", "dslr", "mirrorless"],
  "camera accessories": ["camera", "tripod", "lens", "accessory"],
};

/** Builds a human-readable Rwanda-focused title without changing the storefront product name. */
export function buildProductSeoTitle(name?: string | null, brand?: string | null, category?: string | null, keyDetails?: string | null) {
  const cleanName = (name || "").replace(/\s+/g, " ").trim();
  if (!cleanName) return "";

  let core = cleanName;
  const cleanBrand = (brand || "").trim();
  if (cleanBrand && !core.toLocaleLowerCase().includes(cleanBrand.toLocaleLowerCase())) {
    core = `${cleanBrand} ${core}`;
  }

  const details = (keyDetails || "").replace(/\s+/g, " ").trim();
  if (details && !core.toLocaleLowerCase().includes(details.toLocaleLowerCase())) core = `${core} ${details}`;

  const categoryKey = (category || "").trim().toLocaleLowerCase();
  const categoryTerm = CATEGORY_SEARCH_TERMS[categoryKey];
  const nameLower = core.toLocaleLowerCase();
  const hasCategoryContext = (CATEGORY_ALIASES[categoryKey] || []).some((alias) => nameLower.includes(alias));
  if (categoryTerm && !hasCategoryContext) {
    core = `${core} ${categoryTerm}`;
  }

  core = core
    .replace(/\s+(in Rwanda|Rwanda|IFIX|IFIX)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return `${core} in Rwanda | IFIX`;
}

export function getProductSeoHint(category?: string | null) {
  const normalized = (category || "").trim().toLowerCase();
  if (normalized === "smartphones") return "Include the exact phone model and, when useful, storage or SIM version.";
  if (normalized === "laptops") return "Include the model and useful details such as processor, RAM, and storage.";
  if (normalized.includes("accessories")) return "Include the accessory type and compatible device or brand.";
  if (["audio", "cameras", "tablets", "smartwatches", "gaming"].includes(normalized)) return "Include the exact model and the feature shoppers are most likely to search for.";
  return "Use the exact model and its most useful identifying detail. Keep it clear and accurate.";
}

export function getProductSeoQuestion(category?: string | null) {
  const normalized = (category || "").trim().toLowerCase();
  if (normalized === "smartphones") return "Which storage, SIM, or network version should shoppers find?";
  if (normalized === "laptops") return "Which processor, RAM, or storage should shoppers search for?";
  if (normalized.includes("accessories")) return "Which device or model is this accessory compatible with?";
  if (normalized === "audio") return "What connection type or standout audio feature does it have?";
  if (normalized === "gaming" || normalized === "gaming accessories") return "Which console or gaming feature is it made for?";
  return "What model or standout feature helps shoppers identify this product?";
}
