import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { getProductPricing } from "@shared/product-pricing";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  totalPrice: number;
  quantity: number;
  storage: string;
  color: string;
  imageUrl: string;
  originalPrice?: number;
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { data: products = [] } = useProducts();

  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem("cart");
        setCart(savedCart ? JSON.parse(savedCart) : []);
      } catch {
        setCart([]);
      }
    };
    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, []);

  useEffect(() => {
    if (products.length === 0 || cart.length === 0) return;
    const repricedCart = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return item;
      const storageOffset = product.variations?.storage?.find((option) => option.option === item.storage)?.priceOffset ?? 0;
      const pricing = getProductPricing(product, storageOffset);
      return {
        ...item,
        name: product.name,
        imageUrl: product.imageUrl,
        price: pricing.salePrice,
        originalPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
        totalPrice: pricing.salePrice * item.quantity,
      };
    });
    if (JSON.stringify(repricedCart) !== JSON.stringify(cart)) {
      setCart(repricedCart);
      localStorage.setItem("cart", JSON.stringify(repricedCart));
      window.dispatchEvent(new Event("storage"));
    }
  }, [products, cart]);

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    newCart[index].totalPrice = newCart[index].quantity * newCart[index].price;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const addRecommendedProduct = (product: Product) => {
    const { hasDiscount, salePrice: price, regularPrice } = getProductPricing(product);
    const newCart = [...cart];
    const existingIndex = newCart.findIndex(
      (item) => item.productId === product.id && !item.storage && !item.color
    );

    if (existingIndex >= 0) {
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + 1,
        totalPrice: (newCart[existingIndex].quantity + 1) * newCart[existingIndex].price,
      };
    } else {
      newCart.push({
        productId: product.id,
        name: product.name,
        price,
        originalPrice: hasDiscount ? regularPrice : undefined,
        totalPrice: price,
        quantity: 1,
        storage: "",
        color: "",
        imageUrl: product.imageUrl,
      });
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
    toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
  };

  const goToCheckout = () => {
    localStorage.removeItem("checkout_shipping");
    setLocation("/checkout/shipping");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;
  const cartProductIds = new Set(cart.map((item) => item.productId));
  const cartCategories = new Set(
    cart.map((item) => products.find((product) => product.id === item.productId)?.category).filter(Boolean)
  );
  const availableRecommendations = products.filter(
    (product) => product.stockStatus === "in_stock" && !cartProductIds.has(product.id)
  );
  const recommendations = [
    ...availableRecommendations.filter((product) => cartCategories.has(product.category)),
    ...availableRecommendations.filter((product) => !cartCategories.has(product.category) && (product.isHotDeal || product.isFeatured)),
    ...availableRecommendations.filter((product) => !cartCategories.has(product.category) && !product.isHotDeal && !product.isFeatured),
  ].slice(0, 6);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppFloat />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-4 sm:mb-6">
          <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shopping Cart</h1>
            {cart.length > 0 && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border"
          >
            <div className="relative mb-6">
              <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-20" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" 
              />
            </div>
            <p className="text-xl font-medium text-muted-foreground mb-8">Your cart is feeling a bit light...</p>
            <Link href="/shop">
              <Button size="lg" className="rounded-xl px-8 font-bold">
                Browse Products <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="group relative flex gap-3 rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/25 hover:shadow-md sm:gap-5 sm:p-4"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-white p-2 sm:h-28 sm:w-28 sm:p-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2 sm:block">
                          <div className="min-w-0">
                            {(() => {
                              const product = products.find((entry) => entry.id === item.productId);
                              return (
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {product?.brand || "IFIX"}
                                </p>
                              );
                            })()}
                            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">{item.name}</h3>
                          </div>
                          <p className="shrink-0 text-sm font-black text-primary sm:hidden">{formatPrice(item.totalPrice)}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(() => {
                            const product = products.find((entry) => entry.id === item.productId);
                            const features = [
                              item.storage,
                              item.color,
                              ...Object.values(product?.specs || {}).slice(0, 3),
                            ].filter(Boolean).slice(0, 3);
                            if (features.length === 0 && product?.category) features.push(product.category);
                            return features.map((feature) => (
                            <span key={feature} className="rounded-md border border-border bg-muted/60 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:text-xs">
                              {feature}
                            </span>
                            ));
                          })()}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="line-through">{formatPrice(item.originalPrice * item.quantity)}</span>
                            <span className="ml-2 font-bold text-green-600">
                              {Math.round((1 - item.price / item.originalPrice) * 100)}% off
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-end justify-between gap-2 sm:min-w-32 sm:flex-col sm:items-end">
                        <div className="hidden text-right sm:block">
                          <p className="text-base font-black text-primary">{formatPrice(item.totalPrice)}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatPrice(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => updateQuantity(index, -1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => updateQuantity(index, 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg gap-2 font-semibold"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium"><Truck className="h-4 w-4 text-primary" /> Delivery</span>
                    <span className="font-bold text-green-500">{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full py-6 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                    onClick={goToCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full py-6 text-lg font-bold rounded-2xl border-2 border-primary/10 hover:bg-primary/5 hover:border-primary/20 transition-all"
                    onClick={() => setLocation("/shop")}
                >
                    Add More Items
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>100% Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <section className="mt-10 sm:mt-12" aria-labelledby="cart-recommendations-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" /> Picked for you
                </p>
                <h2 id="cart-recommendations-title" className="text-xl font-bold tracking-tight sm:text-2xl">
                  Recommended for you
                </h2>
              </div>
              <Link href="/shop" className="shrink-0 text-sm font-semibold text-primary hover:underline">
                Browse all
              </Link>
            </div>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {recommendations.map((product) => {
                const { hasDiscount: isDeal, salePrice: price } = getProductPricing(product);
                return (
                  <article
                    key={product.id}
                    className="w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30 sm:w-auto"
                  >
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative flex aspect-square items-center justify-center bg-white p-3">
                        <img
                          src={product.imageUrl || "/placeholder.png"}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain"
                          onError={(event) => { event.currentTarget.src = "/placeholder.png"; }}
                        />
                        {isDeal && (
                          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {product.hotDealDiscount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-3">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {product.brand}
                      </p>
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="mt-1 line-clamp-2 min-h-9 text-xs font-semibold leading-snug hover:text-primary">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="mt-2 truncate text-sm font-black text-primary">{formatPrice(price)}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 h-9 w-full rounded-lg text-xs font-bold"
                        onClick={() => addRecommendedProduct(product)}
                        data-testid={`button-add-recommendation-${product.id}`}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add to cart
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Spacer so the mobile sticky checkout bar never covers the last item/summary */}
        {cart.length > 0 && <div className="h-24 lg:hidden" />}
      </main>

      {/* Sticky mobile checkout bar — keeps checkout reachable without scrolling, sits above the bottom nav */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
            <p className="text-lg font-bold text-primary truncate">{formatPrice(total)}</p>
          </div>
          <Button
            className="flex-1 h-12 font-bold rounded-xl shadow-lg shadow-primary/20"
            onClick={goToCheckout}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}
