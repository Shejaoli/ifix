import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Star, Eye, GitCompare, Heart } from "lucide-react";
import { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { QuickViewModal } from "./QuickViewModal";
import { useCompare } from "@/contexts/CompareContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProductPricing } from "@shared/product-pricing";
import { getResponsiveImageProps } from "@/lib/responsive-image";

interface ProductCardProps {
  product: Product;
  isDeal?: boolean;
  hideFeaturedBadge?: boolean;
}

function useProductRating(productId: number) {
  const { data } = useQuery<Record<string, { averageRating: number; reviewCount: number }>>({
    queryKey: ["/api/reviews/all-stats"],
    staleTime: 60000,
  });
  if (!data) return null;
  const stats = data[productId.toString()];
  return stats && stats.reviewCount > 0 ? stats : null;
}

export function ProductCard({ product, isDeal, hideFeaturedBadge }: ProductCardProps) {
  const rating = useProductRating(product.id);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(product.id);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const [, setLocation] = useLocation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(price);
  };

  const { discount, hasDiscount, salePrice: dealPrice } = getProductPricing(product);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: dealPrice,
      originalPrice: hasDiscount ? product.price : undefined,
      totalPrice: dealPrice,
      quantity: 1,
      storage: "",
      color: "",
      imageUrl: product.imageUrl,
    };
    // Buy Now takes this single item straight to checkout (replaces cart, matching "buy now" intent)
    localStorage.setItem("cart", JSON.stringify([cartItem]));
    window.dispatchEvent(new Event("storage"));
    localStorage.removeItem("checkout_shipping");
    setLocation("/checkout/shipping");
  };

  return (
    <>
      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 active:scale-[0.98]"
      >
        {/* SEO Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.imageUrl,
            "description": product.description,
            "brand": { "@type": "Brand", "name": product.brand },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "RWF",
              "price": dealPrice,
              "availability": product.stockStatus === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })}
        </script>

        {/* Badges - left side */}
        <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-0.5">
          {isDeal && (
            <div className="rounded bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
              Sale
            </div>
          )}
          {product.stockStatus === 'out_of_stock' && (
            <div className="rounded bg-red-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
              Sold Out
            </div>
          )}
          {product.isFeatured && product.stockStatus !== 'out_of_stock' && !hideFeaturedBadge && (
            <div className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary border border-primary/20">
              Featured
            </div>
          )}
        </div>

        {/* Quick View + Compare buttons — top right */}
        <div className="absolute right-1.5 top-1.5 z-10 flex flex-col gap-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuickView(true); }}
            data-testid={`button-quickview-${product.id}`}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 dark:bg-background/90 backdrop-blur-md text-foreground shadow ring-1 ring-black/5 hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
            aria-label="Quick view"
          >
            <Eye className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); inCompare ? removeFromCompare(product.id) : addToCompare(product); }}
            data-testid={`button-compare-${product.id}`}
            className={`hidden sm:flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-md shadow ring-1 transition-all active:scale-90 ${
              inCompare
                ? "bg-primary text-primary-foreground ring-primary/20"
                : "bg-white/90 dark:bg-background/90 text-foreground ring-black/5 hover:bg-primary/10"
            }`}
            aria-label="Compare"
          >
            <GitCompare className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
            data-testid={`button-wishlist-${product.id}`}
            className={`flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-md shadow ring-1 transition-all active:scale-90 ${
              inWishlist
                ? "bg-red-500 text-white ring-red-500/20"
                : "bg-white/90 dark:bg-background/90 text-foreground ring-black/5 hover:bg-red-500/10"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`h-3 w-3 ${inWishlist ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* ── Image — square, same on all screen sizes ── */}
        <Link href={`/product/${product.slug}`} className="block">
          <div className="aspect-square w-full overflow-hidden bg-white dark:bg-gray-50/5">
<img
    src={product.imageUrl || '/placeholder.png'}
    alt={product.name}
    loading='lazy'
    decoding='async'
    width={400}
    height={400}
    className='h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 p-2'
    onError={(e) => { e.currentTarget.srcset = ''; e.currentTarget.src = '/placeholder.png' }}
    {...getResponsiveImageProps(product.imageUrl || '/placeholder.png', '(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 228px')}
  />
          </div>
        </Link>

        {/* ── Text area — fixed layout so every card is the same height ── */}
        <div className="flex flex-col px-2 pt-1.5 pb-2 flex-1">

          {/* Rating row — always reserves space */}
          <div className="flex items-center gap-0.5 mb-1 min-h-[14px]">
            {rating ? (
              <>
                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 shrink-0" />
                <span className="text-[9px] font-bold text-muted-foreground">{rating.averageRating}</span>
                <span className="text-[9px] text-muted-foreground/50">({rating.reviewCount})</span>
              </>
            ) : (
              <span className="text-[9px] text-muted-foreground/30">No reviews yet</span>
            )}
          </div>

          {/* Product name — always exactly 2 lines */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 text-[11px] sm:text-[12px] font-semibold leading-[1.3] text-foreground hover:text-primary transition-colors" style={{ minHeight: "2.6em" }}>
              {product.name}
            </h3>
          </Link>

          {/* Price — compact, adapts to card width */}
          <div className="mt-1.5 min-w-0">
            {hasDiscount && (
              <span className="block text-[9px] font-medium text-muted-foreground/60 line-through truncate">
                {formatPrice(product.price)}
              </span>
            )}
            <div className="text-[11px] sm:text-[13px] font-black tracking-tight text-gray-900 dark:text-white leading-tight truncate">
              {formatPrice(dealPrice)}
            </div>
          </div>

          {/* Buy button — always at bottom, always shows icon + text */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-lg border border-primary/30 bg-primary/8 hover:bg-primary text-primary hover:text-primary-foreground py-1.5 text-[10px] sm:text-[11px] font-bold transition-all active:scale-95"
            data-testid={`button-cart-${product.id}`}
            title="Buy Now"
          >
            <ShoppingCart className="h-3 w-3 shrink-0" />
            <span>Buy</span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
