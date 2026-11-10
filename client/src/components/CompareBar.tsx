import { motion, AnimatePresence } from "framer-motion";
import { X, GitCompare, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { Product } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";
import { getProductPricing } from "@shared/product-pricing";

function CompareModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF" }).format(price);

  const allSpecKeys = Array.from(
    new Set(
      products.flatMap(p => Object.keys((p.specs as Record<string, string>) || {}))
    )
  );

  const rowBg = (i: number) => (i % 2 === 0 ? "bg-accent/30" : "bg-background");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[210] flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl overflow-hidden mb-8"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Product Comparison</h2>
              <span className="text-xs text-muted-foreground">({products.length} products)</span>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground w-36">Feature</th>
                  {products.map(p => (
                    <th key={p.id} className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-20 w-20 rounded-xl overflow-hidden border border-border bg-accent/10 flex items-center justify-center">
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain p-1" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{p.brand}</p>
                        <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 max-w-[140px]">{p.name}</p>
                        <Link href={`/product/${p.slug}`} onClick={onClose}>
                          <span className="text-[10px] text-primary hover:underline cursor-pointer">View Details →</span>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price Row */}
                <tr className="bg-primary/5 border-b border-border">
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Price</td>
                  {products.map(p => {
                    const { discount, hasDiscount, salePrice: dealPrice } = getProductPricing(p);
                    return (
                      <td key={p.id} className="p-4 text-center">
                        {hasDiscount && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</p>
                        )}
                        <p className="text-base font-black text-foreground">{formatPrice(dealPrice)}</p>
                        {hasDiscount && (
                          <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded-full">-{discount}%</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Brand Row */}
                <tr className={`${rowBg(0)} border-b border-border`}>
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center text-sm font-semibold text-foreground">{p.brand}</td>
                  ))}
                </tr>

                {/* Category Row */}
                <tr className={`${rowBg(1)} border-b border-border`}>
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center text-sm text-muted-foreground">{p.category}</td>
                  ))}
                </tr>

                {/* Stock Row */}
                <tr className={`${rowBg(0)} border-b border-border`}>
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Availability</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center">
                      {p.stockStatus === "in_stock" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600">✓ In Stock</span>
                      ) : p.stockStatus === "out_of_stock" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">✗ Out of Stock</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-600">⊙ Pre-Order</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Warranty Row */}
                <tr className={`${rowBg(1)} border-b border-border`}>
                  <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Warranty</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">12 Months</td>
                  ))}
                </tr>

                {/* Spec Rows */}
                {allSpecKeys.map((key, i) => (
                  <tr key={key} className={`${rowBg((i + 2) % 2)} border-b border-border last:border-0`}>
                    <td className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </td>
                    {products.map(p => {
                      const specs = (p.specs as Record<string, string>) || {};
                      const val = specs[key];
                      return (
                        <td key={p.id} className="p-4 text-center text-sm text-foreground">
                          {val || <span className="text-muted-foreground/40">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, isCompareOpen, setIsCompareOpen } = useCompare();
  const [showModal, setShowModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      {showModal && (
        <CompareModal products={compareList} onClose={() => setShowModal(false)} />
      )}

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[150] border-t border-border bg-background/95 backdrop-blur-md shadow-2xl shadow-black/20"
        >
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-2 shrink-0">
                <GitCompare className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground hidden sm:block">
                  Compare ({compareList.length}/3)
                </span>
              </div>

              {/* Product Thumbnails */}
              <div className="flex flex-1 items-center gap-3 overflow-x-auto">
                {compareList.map(product => (
                  <div key={product.id} className="relative flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                    <div className="h-10 w-10 overflow-hidden rounded-lg border border-border bg-accent/10 flex items-center justify-center">
                      <img src={product.imageUrl?.startsWith("http") ? product.imageUrl : (import.meta.env.VITE_API_URL || "") + product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="max-w-[100px] sm:max-w-[140px]">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{product.brand}</p>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{product.name}</p>
                    </div>
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                  <div key={i} className="flex shrink-0 h-14 w-32 items-center justify-center rounded-xl border-2 border-dashed border-border text-[10px] font-medium text-muted-foreground">
                    + Add product
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompare}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  data-testid="button-compare-clear"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:block">Clear</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowModal(true)}
                  disabled={compareList.length < 2}
                  data-testid="button-compare-now"
                  className="text-xs"
                >
                  <GitCompare className="h-3.5 w-3.5 mr-1.5" />
                  Compare Now
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
