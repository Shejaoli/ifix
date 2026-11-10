import { formatSiteCurrency } from "@/lib/site-currency";
import { useRoute, Link, useLocation } from "wouter";
import { useProduct, useProducts, useProductBySlug } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Shield, Truck, Share2, ShoppingBag, Minus, Plus as PlusIcon, ArrowRight, Star, Send, Lock, RotateCcw, BadgeCheck, Heart, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProductPricing } from "@shared/product-pricing";
import { buildProductSeoTitle } from "@/lib/product-seo";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductDetails() {
  const [match, params] = useRoute("/product/:slug");
  const [, setLocation] = useLocation();

  const slug = params?.slug || "";
  const numericId = isNaN(parseInt(slug)) ? 0 : parseInt(slug);
  const isSlugBased = slug !== "" && isNaN(parseInt(slug));

  const bySlug = useProductBySlug(isSlugBased ? slug : "");
  const byId = useProduct(isSlugBased ? 0 : numericId);

  const { data: product, isLoading, error } = isSlugBased ? bySlug : byId;

  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = product ? isInWishlist(product.id) : false;

  const variations = (product?.variations as {
    storage?: { option: string; priceOffset: number; stock?: number }[];
    colors?: { name: string; value: string; stock?: number; imageUrl?: string }[];
  }) || {};

  const storageOptions = variations.storage || [];
  const colorOptions = variations.colors || [];

  const [selectedImage, setSelectedImage] = useState(product?.imageUrl || "");
  const [selectedStorage, setSelectedStorage] = useState(storageOptions[0]?.option || "");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedWarranty, setSelectedWarranty] = useState("");

  // Sticky bar state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const productTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!productTopRef.current) return;
      const rect = productTopRef.current.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (product) {
      const v = product.variations as any || {};
      const s = v.storage || [];
      const c = v.colors || [];
      setSelectedStorage(s[0]?.option || "");
      setSelectedColor(c[0]?.name || "");
    }
  }, [product]);

  useEffect(() => {
    if (product?.imageUrl) {
      setSelectedImage(product.imageUrl);
      const viewedIds = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as number[];
      const updatedViewed = [product.id, ...viewedIds.filter(id => id !== product.id)].slice(0, 10);
      localStorage.setItem("recentlyViewed", JSON.stringify(updatedViewed));
      window.dispatchEvent(new Event("storage"));
    }
  }, [product]);

  useEffect(() => {
    if (!product || !selectedColor) return;
    const colors = (product.variations as { colors?: { name: string; imageUrl?: string }[] } | null)?.colors || [];
    const colorImage = colors.find((color) => color.name === selectedColor)?.imageUrl;
    setSelectedImage(colorImage || product.imageUrl);
  }, [product, selectedColor]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: relatedProducts } = useProducts({ category: product?.category });
  const recommendations = relatedProducts?.filter(p => p.id !== product?.id).sort((a, b) => {
    if (a.brand === product?.brand && b.brand !== product?.brand) return -1;
    if (a.brand !== product?.brand && b.brand === product?.brand) return 1;
    return 0;
  }).slice(0, 4) || [];

  const { data: reviewData } = useQuery<{ reviews: any[]; stats: { averageRating: number; reviewCount: number } }>({
    queryKey: ["/api/products", product?.id, "reviews"],
    enabled: !!product?.id,
    queryFn: () => fetch(`/api/products/${product!.id}/reviews`).then(r => r.json()),
  });

  const [reviewForm, setReviewForm] = useState({ customerName: "", rating: 5, reviewText: "" });
  const [hoverRating, setHoverRating] = useState(0);

  const submitReviewMutation = useMutation({
    mutationFn: (data: { customerName: string; rating: number; reviewText: string }) =>
      apiRequest("POST", `/api/products/${product!.id}/reviews`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id, "reviews"] });
      setReviewForm({ customerName: "", rating: 5, reviewText: "" });
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit review. Please try again.", variant: "destructive" });
    },
  });

  const productReviews = reviewData?.reviews || [];
  const reviewStats = reviewData?.stats || { averageRating: 0, reviewCount: 0 };
  const categoryLabel = product?.category || "Products";
  const categoryHref = `/shop?category=${encodeURIComponent(categoryLabel)}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ifix.rw" },
      { "@type": "ListItem", "position": 2, "name": "Electronics", "item": "https://ifix.rw/shop" },
      { "@type": "ListItem", "position": 3, "name": categoryLabel, "item": `https://ifix.rw${categoryHref}` },
      { "@type": "ListItem", "position": 4, "name": product?.name || "Product", "item": `https://ifix.rw/product/${product?.slug}` }
    ]
  };

  useEffect(() => {
    if (!product) return;
    const desc = product.description.substring(0, 160);
    const pageTitle = product.metaTitle?.trim() || buildProductSeoTitle(product.name, product.brand, product.category);
    document.title = pageTitle;
    const setMeta = (name: string, content: string, attr: string = 'name') => {
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attr, name); document.head.appendChild(meta); }
      meta.content = content;
    };
    setMeta('description', desc);
    const baseKeywords = [product.name, product.brand, product.category, "buy in Rwanda", "Kigali electronics"];
    const savedKeywords = (product.searchKeywords as string[] | null) || [];
    setMeta('keywords', [...new Set([...baseKeywords, ...savedKeywords])].join(", "));
    setMeta('robots', 'index, follow');
    setMeta('og:title', pageTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:image', product.imageUrl, 'property');
    setMeta('og:url', window.location.href, 'property');
    setMeta('og:type', 'product', 'property');
    setMeta('og:price:amount', getProductPricing(product).salePrice.toString(), 'property');
    setMeta('og:price:currency', 'RWF', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', product.imageUrl);
  }, [product]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background text-primary">Loading...</div>;
  if (error || !product) return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
      <p>Product not found.</p>
      <Link href="/shop" className="text-primary hover:underline mt-4">Back to Shop</Link>
    </div>
  );

  const currentStorage = storageOptions.find(s => s.option === selectedStorage);
  const currentColor = colorOptions.find(c => c.name === selectedColor);
  const galleryImages = Array.from(new Set([
    currentColor?.imageUrl,
    product.imageUrl,
    ...(product.additionalImages || []),
  ].filter((image): image is string => Boolean(image))));
  const selectColor = (color: (typeof colorOptions)[number]) => {
    if (color.stock === 0) return;
    setSelectedColor(color.name);
    setSelectedImage(color.imageUrl || product.imageUrl);
  };
  const productPricing = getProductPricing(product, currentStorage?.priceOffset || 0);
  const isOutOfStock = (currentStorage?.stock === 0) || (currentColor?.stock === 0);
  const maxStock = Math.min(currentStorage?.stock ?? 99, currentColor?.stock ?? 99);

  const handleAddToCart = () => {
    const itemTotalPrice = productPricing.salePrice * quantity;
    const cartItem = {
      productId: product.id, name: product.name,
      price: productPricing.salePrice, originalPrice: productPricing.hasDiscount ? productPricing.regularPrice : undefined, totalPrice: itemTotalPrice,
      quantity, storage: selectedStorage, color: selectedColor, imageUrl: selectedImage || product.imageUrl,
    };
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const matchIndex = existingCart.findIndex((item: any) =>
      item.productId === cartItem.productId &&
      item.storage === cartItem.storage &&
      item.color === cartItem.color
    );
    if (matchIndex > -1) {
      existingCart[matchIndex].quantity += cartItem.quantity;
      existingCart[matchIndex].totalPrice = existingCart[matchIndex].quantity * existingCart[matchIndex].price;
    } else {
      existingCart.push(cartItem);
    }
    localStorage.setItem("cart", JSON.stringify(existingCart));
    const viewedIds = JSON.parse(localStorage.getItem("recentlyViewed") || "[]") as number[];
    localStorage.setItem("recentlyViewed", JSON.stringify([product.id, ...viewedIds.filter(id => id !== product.id)].slice(0, 10)));
    window.dispatchEvent(new Event("storage"));
    toast({ title: "Added to cart", description: `${quantity}x ${product.name} added to your cart.` });
    setLocation("/cart");
  };

  const handleBuyNow = () => {
    const itemTotalPrice = productPricing.salePrice * quantity;
    const cartItem = {
      productId: product.id, name: product.name,
      price: productPricing.salePrice, originalPrice: productPricing.hasDiscount ? productPricing.regularPrice : undefined, totalPrice: itemTotalPrice,
      quantity, storage: selectedStorage, color: selectedColor, imageUrl: selectedImage || product.imageUrl,
    };
    // Buy Now takes this single item straight to checkout (replaces cart, matching "buy now" intent)
    localStorage.setItem("cart", JSON.stringify([cartItem]));
    localStorage.removeItem("checkout_shipping");
    window.dispatchEvent(new Event("storage"));
    setLocation("/checkout/shipping");
  };

  const totalPrice = productPricing.salePrice * quantity;
  const formatPrice = formatSiteCurrency;

  const whatsappOrderMessage = `Hello IFIX, I want to order: ${product.name} - RF ${productPricing.salePrice}. Please confirm availability.`;
  const whatsappUrl = `https://wa.me/250788442127?text=${encodeURIComponent(whatsappOrderMessage)}`;
  const specs = product.specs as Record<string, string> || {};

  const priceValidUntilStr = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
  const productSchema = {
    "@context": "https://schema.org", "@type": "Product",
    "name": product.name, "image": [product.imageUrl, ...(product.additionalImages || [])],
    "description": product.description, "sku": `IFIX-${product.id}`,
    "brand": { "@type": "Brand", "name": (product.brand && product.brand.trim() !== "") ? product.brand.trim() : "IFIX" },
    ...(reviewStats.reviewCount > 0 ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": reviewStats.averageRating.toString(), "reviewCount": reviewStats.reviewCount.toString(), "bestRating": "5", "worstRating": "1" } } : {}),
    "offers": {
      "@type": "Offer", "price": getProductPricing(product).salePrice.toString(), "priceCurrency": "RWF",
      "priceValidUntil": priceValidUntilStr,
      "availability": product.stockStatus === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/RefurbishedCondition",
      "url": `https://ifix.rw/product/${product.slug}`,
      "seller": { "@type": "Organization", "name": "IFIX" }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{product.metaTitle?.trim() || buildProductSeoTitle(product.name, product.brand, product.category)}</title>
        <meta name="description" content={`Buy ${product.name} in Rwanda. Certified refurbished, 12-month warranty, fast delivery in Kigali. ${product.description.substring(0, 100)}...`} />
        <meta name="keywords" content={[product.name, product.brand, product.category, "buy in Rwanda", "Kigali electronics", ...((product.searchKeywords as string[] | null) || [])].join(", ")} />
        <meta property="og:title" content={product.metaTitle?.trim() || buildProductSeoTitle(product.name, product.brand, product.category)} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.imageUrl} />
        <meta property="og:url" content={`https://ifix.rw/product/${product.slug}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.metaTitle?.trim() || buildProductSeoTitle(product.name, product.brand, product.category)} />
        <meta name="twitter:description" content={product.description.substring(0, 100)} />
        <meta name="twitter:image" content={product.imageUrl} />
        <link rel="canonical" href={`https://ifix.rw/product/${product.slug}`} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      {/* ===== DESKTOP STICKY ADD TO CART BAR ===== */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="hidden md:flex fixed bottom-5 left-0 right-0 mx-auto z-50 bg-background/95 backdrop-blur border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] items-center gap-4 px-5 py-3 w-[min(860px,calc(100vw-48px))]"
          >
            <img src={product.imageUrl?.startsWith("http") ? product.imageUrl : (import.meta.env.VITE_API_URL || "") + product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-border flex-shrink-0" />
            <p className="flex-1 text-sm font-semibold text-foreground truncate max-w-xs">{product.name}</p>
            <span className="text-base font-bold text-primary whitespace-nowrap">{formatPrice(totalPrice)}</span>
            <div className="flex items-center rounded-lg border border-border bg-card h-9">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-8 h-full flex items-center justify-center text-primary disabled:opacity-40 hover:bg-muted rounded-l-lg transition-colors">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-foreground">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} disabled={quantity >= maxStock || isOutOfStock} className="w-8 h-full flex items-center justify-center text-primary disabled:opacity-40 hover:bg-muted rounded-r-lg transition-colors">
                <PlusIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              size="sm"
              className="h-9 px-5 font-bold rounded-lg"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              {isOutOfStock ? "Out of Stock" : "Buy Now"}
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              size="sm"
              variant="outline"
              className="h-9 px-5 font-bold rounded-lg border-primary text-primary hover:bg-primary/5"
            >
              Add to Cart
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-2 py-2 sm:px-6 sm:py-6 lg:px-8">
        {/* Store location breadcrumb */}
        <nav ref={productTopRef} aria-label="Breadcrumb" className="mb-2 min-w-0 md:mb-4">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm">
            <li className="shrink-0">
              <Link href="/" className="rounded-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Home</Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-muted-foreground/50"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="shrink-0">
              <Link href="/shop" className="rounded-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Electronics</Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-muted-foreground/50"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="min-w-0 shrink">
              <Link href={categoryHref} className="rounded-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{categoryLabel}</Link>
            </li>
            <li aria-hidden="true" className="shrink-0 text-muted-foreground/50"><ChevronRight className="h-3.5 w-3.5" /></li>
            <li aria-current="page" className="min-w-0 max-w-[45vw] truncate font-semibold text-foreground sm:max-w-[360px]">{product.name}</li>
          </ol>
          <span className="sr-only">You are viewing {product.name} in {categoryLabel}.</span>
        </nav>

        {/* ===== DESKTOP PRODUCT TOP SECTION ===== */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-6 items-start">

          {/* Column 1: Image Gallery (4 cols) */}
          <div className="col-span-4 sticky top-20">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-card p-4 mb-3 relative">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
            {/* Thumbnails row */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all hover:scale-105 ${selectedImage === img ? "border-primary shadow-md" : "border-border opacity-60 hover:opacity-100"}`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Core Product Info (5 cols) */}
          <div className="col-span-5 space-y-4">
            {/* Brand + Stock */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{product.brand}</span>
              {isOutOfStock ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Out of Stock</span>
              ) : product.stockStatus === 'in_stock' ? (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">In Stock</span>
              ) : (
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">Pre-Order</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground leading-snug">{product.name}</h1>

            {/* Rating row */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= Math.round(reviewStats.averageRating || 4) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{reviewStats.averageRating > 0 ? reviewStats.averageRating : "4.5"}</span>
              <span className="text-xs text-muted-foreground">({reviewStats.reviewCount > 0 ? reviewStats.reviewCount : "12"} reviews)</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => product && toggleWishlist(product)}
                  className={`transition-colors ${inWishlist ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                  title="Wishlist"
                >
                  <Heart className={`h-4 w-4 ${inWishlist ? "fill-red-500" : ""}`} />
                </button>
                <button className="text-muted-foreground hover:text-primary transition-colors" title="Share"
                  onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); }}>
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-primary tracking-tight">{formatPrice(totalPrice)}</span>
                <span className="text-xs text-muted-foreground">Incl. VAT</span>
              </div>
              {productPricing.hasDiscount && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(productPricing.regularPrice * quantity)}</span>
                  <span className="text-xs font-black text-white bg-green-600 px-2 py-0.5 rounded-full">{productPricing.discount}% OFF</span>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Storage Selection */}
            {storageOptions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  Storage: <span className="text-foreground normal-case font-semibold">{selectedStorage}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map(opt => (
                    <button
                      key={opt.option}
                      onClick={() => opt.stock !== 0 && setSelectedStorage(opt.option)}
                      disabled={opt.stock === 0}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedStorage === opt.option
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary"
                      } ${opt.stock === 0 ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                    >
                      {opt.option}{opt.stock === 0 && " (Out)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colorOptions.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  Color: <span className="text-foreground normal-case font-semibold">{selectedColor}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color.name}
                      onClick={() => selectColor(color)}
                      disabled={color.stock === 0}
                      className={`flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all w-16 ${
                        selectedColor === color.name ? "border-primary" : "border-border hover:border-primary/50"
                      } ${color.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="h-10 w-10 rounded-lg border border-border/50" style={{ backgroundColor: color.value }} />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description preview */}
            <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{product.description}</div>
          </div>

          {/* Column 3: Buy Box (3 cols) */}
          <div className="col-span-3">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 sticky top-20">
              {/* Price in buy box */}
              <div className="text-xl font-black text-primary">{formatPrice(totalPrice)}</div>

              {/* Stock status */}
              {isOutOfStock ? (
                <div className="rounded-lg bg-destructive/10 p-2 text-center text-xs font-semibold text-destructive">
                  This combination is out of stock.
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Available</span>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Qty</span>
                <div className="flex items-center rounded-lg border border-border bg-background h-8">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-8 h-full flex items-center justify-center text-primary disabled:opacity-40 hover:bg-muted rounded-l-lg transition-colors">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} disabled={quantity >= maxStock || isOutOfStock} className="w-8 h-full flex items-center justify-center text-primary disabled:opacity-40 hover:bg-muted rounded-r-lg transition-colors">
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <Button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full h-9 text-sm font-bold rounded-xl shadow-sm shadow-primary/20"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                {isOutOfStock ? "Out of Stock" : "Buy Now"}
              </Button>
              <Button
                onClick={handleAddToCart}
                variant="outline"
                disabled={isOutOfStock}
                className="w-full h-9 text-sm font-bold rounded-xl border-primary text-primary hover:bg-primary/5"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="button-whatsapp-order"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#25D366] h-9 text-sm font-bold text-white transition-all hover:bg-[#1ebe5d] shadow-sm shadow-[#25D366]/20"
              >
                <SiWhatsapp className="h-4 w-4" />
                Order on WhatsApp
              </a>

              <div className="h-px bg-border" />

              {/* Trust mini badges */}
              <div className="space-y-2">
                {[
                  { icon: <Shield className="h-3.5 w-3.5 text-primary" />, text: "1-Year Warranty" },
                  { icon: <Truck className="h-3.5 w-3.5 text-green-500" />, text: "Fast Delivery in Kigali" },
                  { icon: <RotateCcw className="h-3.5 w-3.5 text-orange-500" />, text: "30-Day Returns" },
                  { icon: <Lock className="h-3.5 w-3.5 text-purple-500" />, text: "Secure Checkout" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {b.icon}
                    <span className="text-xs text-muted-foreground">{b.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Certified genuine — verified by IFIX</p>
              </div>

              <p className="text-center text-[10px] text-muted-foreground">Direct orders confirmed via phone. WhatsApp handled by our sales team.</p>
            </div>
          </div>
        </div>

        {/* ===== DESKTOP BELOW-THE-FOLD SECTIONS ===== */}
        <div className="hidden md:block mt-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Description + Specs + FAQ + Reviews (9 cols) */}
            <div className="col-span-9 space-y-6">

              {/* Description */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Product Overview</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Specs */}
              {Object.keys(specs).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                    {product.category === "Laptops" ? "Laptop Configuration" : "Technical Specifications"}
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-0">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between border-b border-border py-2.5 gap-4">
                        <dt className="text-xs text-muted-foreground font-medium shrink-0">{key}</dt>
                        <dd className="text-xs font-semibold text-foreground text-right break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* FAQ */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Frequently Asked Questions</h3>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    { q: "Is this product brand new?", a: "We offer both brand new and certified refurbished electronics. Refurbished items undergo rigorous testing and are restored to like-new condition with genuine parts." },
                    { q: "Does it have warranty?", a: "Yes, all our electronics come with a 1-year limited warranty covering hardware defects. Our dedicated service center in Kigali handles all warranty claims promptly." },
                    { q: "How long does delivery take?", a: "Delivery within Kigali typically takes 2–4 hours. For orders outside Kigali, delivery takes 24–48 hours depending on your location." },
                    { q: "Can I pay on delivery?", a: "Yes, we support Cash on Delivery and Momo Pay on Delivery for all orders within Kigali. For orders outside Kigali, we require payment before shipping." },
                  ].map((item, i) => (
                    <AccordionItem key={i} value={`d-${i}`} className="border-border">
                      <AccordionTrigger className="text-sm font-semibold hover:text-primary transition-colors py-3">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Customer Reviews */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Customer Reviews</h2>
                    {reviewStats.reviewCount > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-4 w-4 ${i <= Math.round(reviewStats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{reviewStats.averageRating} out of 5</span>
                        <span className="text-sm text-muted-foreground">({reviewStats.reviewCount} {reviewStats.reviewCount === 1 ? "review" : "reviews"})</span>
                      </div>
                    )}
                  </div>
                </div>

                {productReviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <Star className="mx-auto mb-3 h-7 w-7 text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-foreground">Be the first to review this product</p>
                    <p className="text-xs text-muted-foreground mt-1">Share your experience to help other customers.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {productReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {review.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{review.customerName}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                            </div>
                          </div>
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{review.reviewText}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Write a Review */}
                <div className="mt-6 border-t border-border pt-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">Write a Review</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!reviewForm.customerName.trim() || !reviewForm.reviewText.trim()) return;
                      submitReviewMutation.mutate(reviewForm);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-1" htmlFor="d-review-name">Your Name</label>
                      <input
                        id="d-review-name"
                        data-testid="input-review-name"
                        type="text"
                        required
                        value={reviewForm.customerName}
                        onChange={e => setReviewForm(f => ({ ...f, customerName: e.target.value }))}
                        placeholder="Enter your name"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-1">Star Rating</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button" data-testid={`button-rating-${s}`}
                            onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-0.5"
                          >
                            <Star className={`h-6 w-6 transition-colors ${s <= (hoverRating || reviewForm.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                        <span className="ml-2 self-center text-xs text-muted-foreground">{reviewForm.rating} / 5</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-1" htmlFor="d-review-text">Review</label>
                      <textarea
                        id="d-review-text"
                        data-testid="input-review-text"
                        required
                        value={reviewForm.reviewText}
                        onChange={e => setReviewForm(f => ({ ...f, reviewText: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>
                    <Button type="submit" size="sm" data-testid="button-submit-review"
                      disabled={submitReviewMutation.isPending || !reviewForm.customerName.trim() || !reviewForm.reviewText.trim()}
                      className="flex items-center gap-1.5 h-8 text-xs font-bold"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right: Extended Warranty + Trust (3 cols) */}
            <div className="col-span-3 space-y-4">
              {/* Extended Warranty */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground">Extended Warranty</p>
                  <span className="text-[9px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">NEW</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">Authorised repair centers across Rwanda</p>
                <div className="flex gap-2">
                  {["1 Year", "2 Years"].map(yr => (
                    <button
                      key={yr}
                      onClick={() => setSelectedWarranty(prev => prev === yr ? "" : yr)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedWarranty === yr
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                {[
                  { icon: <Shield className="h-4 w-4 text-primary" />, title: "1-Year Warranty", sub: "Hardware coverage" },
                  { icon: <Truck className="h-4 w-4 text-green-600" />, title: "Fast Delivery", sub: "2–4 hrs in Kigali" },
                  { icon: <RotateCcw className="h-4 w-4 text-orange-500" />, title: "30-Day Returns", sub: "Hassle-free policy" },
                  { icon: <Lock className="h-4 w-4 text-purple-500" />, title: "Secure Checkout", sub: "SSL encrypted" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">{b.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE-ONLY DETAIL LAYOUT ===== */}
        <div className="md:hidden mt-1 space-y-2 pb-36">

          {/* 1. Title + Rating + Icons */}
          <div>
            <h1 className="text-[15px] font-bold text-gray-900 dark:text-white leading-snug">{product.name}</h1>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(reviewStats.averageRating || 4) ? "fill-[#FFC107] text-[#FFC107]" : "text-gray-300"}`} />
                ))}
                <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 ml-0.5">{reviewStats.averageRating > 0 ? reviewStats.averageRating : "4.5"}</span>
                <span className="text-[11px] text-gray-400">({reviewStats.reviewCount > 0 ? reviewStats.reviewCount : "12"} reviews)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => product && toggleWishlist(product)}
                  className={`transition-colors ${inWishlist ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                  title="Wishlist"
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? "fill-red-500" : ""}`} />
                </button>
                <button className="text-gray-400 hover:text-[#00858d] transition-colors" title="Share"
                  onClick={() => { if (navigator.share) navigator.share({ title: product.name, url: window.location.href }); }}>
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-1.5 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Mobile Image Gallery */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-[min(58vw,250px)] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-2">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex min-h-4 items-center justify-center gap-1.5" aria-label="Product image selector">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Show product image ${idx + 1} of ${galleryImages.length}`}
                  aria-current={selectedImage === img ? "true" : undefined}
                  className={`h-2 w-2 rounded-full transition-all ${selectedImage === img ? "w-5 bg-primary" : "bg-muted-foreground/35 hover:bg-muted-foreground/60"}`}
                >
                  <span className="sr-only">Image {idx + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price follows the image gallery on mobile. */}
          <div className="pdp-price flex items-baseline gap-2 py-0.5">
            <span className="text-[20px] font-black text-gray-900 dark:text-white tracking-tight">{formatPrice(totalPrice)}</span>
            <span className="text-[10px] text-gray-400 font-normal">Incl. VAT</span>
            {productPricing.hasDiscount && <span className="text-[11px] text-gray-400 line-through">{formatPrice(productPricing.regularPrice * quantity)}</span>}
            {productPricing.hasDiscount && <span className="text-[9px] font-black text-white bg-green-600 px-2 py-0.5 rounded-full">{productPricing.discount}% OFF</span>}
            {isOutOfStock && <span className="text-[10px] font-semibold text-red-500">Out of Stock</span>}
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          {/* 3. Storage / Memory Selector */}
          {storageOptions.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200 mb-2">
                Internal Memory: <span className="text-[#00858d]">{selectedStorage}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {storageOptions.map(opt => (
                  <button
                    key={opt.option}
                    onClick={() => !opt.stock === false && setSelectedStorage(opt.option)}
                    disabled={opt.stock === 0}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      selectedStorage === opt.option
                        ? "bg-[#00858d] text-white border-[#00858d]"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                    } ${opt.stock === 0 ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                  >
                    {opt.option}{opt.stock === 0 && " (Out)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Color Variant Selector */}
          {colorOptions.length > 0 && (
            <div>
              <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200 mb-2">
                Colour: <span className="text-[#00858d]">{selectedColor}</span>
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {colorOptions.map(color => (
                  <button
                    key={color.name}
                    onClick={() => selectColor(color)}
                    disabled={color.stock === 0}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-xl border-2 transition-all w-[72px] ${
                      selectedColor === color.name ? "border-[#00858d]" : "border-gray-200 dark:border-gray-600"
                    } ${color.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div className="h-[56px] w-[56px] rounded-lg border border-gray-100" style={{ backgroundColor: color.value }} />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate w-full text-center font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. Extended Warranty */}
          <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-black text-gray-800 dark:text-gray-200">Get Extended Warranty</p>
              <span className="text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">NEW</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">Authorised repair centers across Rwanda</p>
            <div className="flex gap-2">
              {["1 Year", "2 Years"].map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedWarranty(prev => prev === yr ? "" : yr)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                    selectedWarranty === yr
                      ? "bg-[#00858d] text-white border-[#00858d]"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* 9. Description */}
          <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">About this item</p>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* 10. Specs (if any) */}
          {Object.keys(specs).length > 0 && (
            <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">Specifications</p>
              <dl className="space-y-2">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-1.5">
                    <dt className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{k}</dt>
                    <dd className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 11. Trust Badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Shield className="h-4 w-4 text-[#00858d]" />, title: "1-Year Warranty", sub: "Hardware coverage" },
              { icon: <Truck className="h-4 w-4 text-green-600" />, title: "Fast Delivery", sub: "2–4 hrs in Kigali" },
              { icon: <RotateCcw className="h-4 w-4 text-orange-500" />, title: "30-Day Returns", sub: "Hassle-free policy" },
              { icon: <Lock className="h-4 w-4 text-purple-500" />, title: "Secure Checkout", sub: "SSL encrypted" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700">{b.icon}</div>
                <div>
                  <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{b.title}</p>
                  <p className="text-[10px] text-gray-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 12. WhatsApp Order */}
          <a href={whatsappUrl} target="_blank" rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#25D366] py-3 text-[14px] font-bold text-white"
          >
            <SiWhatsapp className="h-5 w-5" />
            Order on WhatsApp
          </a>

          {/* 13. FAQ */}
          <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">FAQs</p>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Is this product brand new?", a: "We offer both brand new and certified refurbished electronics. Check product specs for condition." },
                { q: "Does it have warranty?", a: "Yes, all products come with a 1-year limited warranty from our Kigali service center." },
                { q: "How long is delivery?", a: "2–4 hours within Kigali. 24–48 hours outside Kigali." },
                { q: "Can I pay on delivery?", a: "Yes — Cash on Delivery and Momo Pay available for Kigali orders." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`m-${i}`} className="border-gray-100 dark:border-gray-700">
                  <AccordionTrigger className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 hover:text-[#00858d] py-2">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed pb-2">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Mobile Reviews */}
          <div className="rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">Customer Reviews</p>
            {productReviews.length === 0 ? (
              <div className="text-center py-4">
                <Star className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">Be the first to review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {productReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">{review.customerName}</span>
                      <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{review.reviewText}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Write review form mobile */}
            <form className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2"
              onSubmit={(e) => { e.preventDefault(); if (!reviewForm.customerName.trim() || !reviewForm.reviewText.trim()) return; submitReviewMutation.mutate(reviewForm); }}
            >
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Write a Review</p>
              <input type="text" required value={reviewForm.customerName} onChange={e => setReviewForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Your name" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-[12px] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00858d]/30" />
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}>
                    <Star className={`h-5 w-5 ${s <= (hoverRating || reviewForm.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <textarea required value={reviewForm.reviewText} onChange={e => setReviewForm(f => ({ ...f, reviewText: e.target.value }))}
                placeholder="Share your experience..." rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-[12px] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00858d]/30 resize-none" />
              <button type="submit" disabled={submitReviewMutation.isPending}
                className="flex items-center gap-1.5 bg-[#00858d] text-white text-[12px] font-bold px-4 py-2 rounded-lg disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">You May Also Like</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Customers who viewed this also considered these items</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
                  View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ===== STICKY MOBILE ADD TO CART BAR ===== */}
      <div className="fixed bottom-16 left-0 right-0 z-[60] md:hidden bg-white dark:bg-gray-900 shadow-[0_-2px_16px_rgba(0,0,0,0.12)] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center rounded-[10px] border-2 border-[#00858d] bg-white dark:bg-gray-800 h-12 shrink-0">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}
            className="w-10 h-full flex items-center justify-center text-[#00858d] font-black text-lg disabled:opacity-40">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-black text-[14px] text-gray-800 dark:text-white">{quantity}</span>
          <button onClick={() => setQuantity(Math.min(maxStock, quantity + 1))} disabled={quantity >= maxStock || isOutOfStock}
            className="w-10 h-full flex items-center justify-center text-[#00858d] font-black text-lg disabled:opacity-40">
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <button onClick={handleAddToCart} disabled={isOutOfStock}
          className="flex-1 h-12 bg-[#00858d] hover:bg-[#006e75] disabled:opacity-50 text-white font-bold text-[15px] rounded-[10px] flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
          <ShoppingBag className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>

      <Footer />
    </div>
  );
}
