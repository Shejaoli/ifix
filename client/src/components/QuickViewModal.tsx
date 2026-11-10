import { formatSiteCurrency } from "@/lib/site-currency";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, ArrowRight, GitCompare } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCompare } from "@/contexts/CompareContext";
import { getProductPricing } from "@shared/product-pricing";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

function QuickViewContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const { toast } = useToast();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [selectedImage, setSelectedImage] = useState(0);

  const formatPrice = formatSiteCurrency;

  const { discount, hasDiscount, salePrice: dealPrice } = getProductPricing(product);

  const images = [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);
  const specs = (product.specs as Record<string, string>) || {};
  const specEntries = Object.entries(specs).slice(0, 4);

  const whatsappUrl = `https://wa.me/250788442127?text=${encodeURIComponent(
    `Hello IFIX, I am interested in buying ${product.name} for ${formatPrice(dealPrice)}`
  )}`;

  const handleAddToCart = () => {
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
    const existing = JSON.parse(localStorage.getItem("cart") || "[]");
    const matchIndex = existing.findIndex((item: any) =>
      item.productId === cartItem.productId &&
      item.storage === cartItem.storage &&
      item.color === cartItem.color
    );
    if (matchIndex > -1) {
      existing[matchIndex].quantity += cartItem.quantity;
      existing[matchIndex].totalPrice = existing[matchIndex].quantity * existing[matchIndex].price;
    } else {
      existing.push(cartItem);
    }
    localStorage.setItem("cart", JSON.stringify(existing));
    window.dispatchEvent(new Event("storage"));
    toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
    onClose();
  };

  const inCompare = isInCompare(product.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ position: "fixed" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="relative w-full max-w-3xl bg-background rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
          data-testid="button-quickview-close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto rounded-2xl">
          <div className="grid md:grid-cols-2">
            {/* Image Section */}
            <div className="bg-accent/10 p-6 flex flex-col gap-3">
              <div className="aspect-square rounded-xl overflow-hidden bg-background flex items-center justify-center border border-border">
                <img
                  src={images[selectedImage] || product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain p-2"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx
                          ? "border-primary shadow-md"
                          : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="p-6 flex flex-col min-h-0">
              {/* Brand + Stock */}
              <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {product.brand}
                </span>
                {product.stockStatus === "in_stock" ? (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    In Stock
                  </span>
                ) : product.stockStatus === "out_of_stock" ? (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                    Out of Stock
                  </span>
                ) : (
                  <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-600">
                    Pre-Order
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-xl font-bold text-foreground mb-3 leading-tight pr-8">
                {product.name}
              </h2>

              {/* Price */}
              <div className="mb-4">
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded-full">
                      -{discount}%
                    </span>
                  </div>
                )}
                <span className="text-2xl font-black text-foreground">
                  {formatPrice(dealPrice)}
                </span>
              </div>

              {/* Trust */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>12-Month Warranty</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Fast Delivery</span>
                </div>
              </div>

              {/* Key Specs */}
              {specEntries.length > 0 && (
                <div className="mb-4 rounded-xl border border-border bg-accent/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Key Specs
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {specEntries.map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-xs font-semibold text-foreground">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                {product.description}
              </p>

              {/* Actions */}
              <div className="mt-auto space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stockStatus === "out_of_stock"}
                    className="text-sm"
                    data-testid="button-quickview-addcart"
                  >
                    Add to Cart
                  </Button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                  >
                    <SiWhatsapp className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/product/${product.slug}`} onClick={onClose}>
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      data-testid="button-quickview-details"
                    >
                      Full Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className={`text-sm ${
                      inCompare ? "border-primary text-primary bg-primary/5" : ""
                    }`}
                    onClick={() =>
                      inCompare ? removeFromCompare(product.id) : addToCompare(product)
                    }
                    data-testid="button-quickview-compare"
                  >
                    <GitCompare className="mr-1.5 h-3.5 w-3.5" />
                    {inCompare ? "✓ Added" : "Compare"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  return createPortal(
    <AnimatePresence>
      <QuickViewContent product={product} onClose={onClose} />
    </AnimatePresence>,
    document.body
  );
}

