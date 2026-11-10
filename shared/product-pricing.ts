export type DiscountableProduct = {
  price: number;
  isHotDeal?: boolean | null;
  hotDealDiscount?: number | null;
};

/** Keep the regular and active hot-deal price consistent across the storefront. */
export function getProductPricing(product: DiscountableProduct, priceOffset = 0) {
  const regularPrice = Math.max(0, product.price + priceOffset);
  const discount = product.isHotDeal
    ? Math.min(100, Math.max(0, product.hotDealDiscount ?? 0))
    : 0;
  const hasDiscount = discount > 0;

  return {
    regularPrice,
    discount,
    hasDiscount,
    salePrice: hasDiscount ? Math.round(regularPrice * (1 - discount / 100)) : regularPrice,
  };
}
