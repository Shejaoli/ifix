import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import type { Product } from "@shared/schema";

const ROTATING_SEARCHES = ["iPhone 17 Pro Max", "iPhone 16", "wireless earbuds", "USB-C hub", "portable speaker"];

export function NavbarSearch({ mobile = false }: { mobile?: boolean }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [active, setActive] = useState(false);
  const [rotatingSearch, setRotatingSearch] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (active || query.trim() || reducedMotion) return;
    const interval = window.setInterval(() => {
      setRotatingSearch((index) => (index + 1) % ROTATING_SEARCHES.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [active, query, reducedMotion]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLocation(`/shop?search=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setShowSuggestions(false);
    setActive(false);
  };

  const chooseProduct = (product: Product) => {
    setLocation(`/product/${product.slug}`);
    setQuery("");
    setShowSuggestions(false);
    setActive(false);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(value.trim())}`);
        if (!response.ok) throw new Error("Search failed");
        const products = await response.json() as Product[];
        setSuggestions(products.slice(0, 8));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActive(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const showRotatingPrompt = !active && !query && !reducedMotion;

  return (
    <div className={`relative w-full ${mobile ? "max-w-none" : "max-w-xl"}`} ref={searchRef}>
      <form onSubmit={submitSearch} className="relative w-full">
        <button type="submit" className={`absolute left-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-primary/10 ${active ? "text-primary" : "text-foreground"}`} aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => { setActive(true); if (query && suggestions.length) setShowSuggestions(true); }}
          onBlur={(event) => {
            if (!event.currentTarget.value) setActive(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((index) => Math.max(index - 1, -1));
            } else if (event.key === "Escape") {
              setShowSuggestions(false);
              setActive(false);
              event.currentTarget.blur();
            } else if (event.key === "Enter" && selectedIndex >= 0) {
              event.preventDefault();
              chooseProduct(suggestions[selectedIndex]);
            }
          }}
          placeholder=""
          autoComplete="off"
          className="h-11 w-full rounded-full border border-border/70 bg-background pl-12 pr-12 text-sm text-foreground shadow-[0_3px_12px_rgba(20,30,50,0.10)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-primary/70 focus:shadow-[0_5px_18px_rgba(20,30,50,0.16)] focus:ring-2 focus:ring-primary/15"
          aria-label="Search products"
          aria-expanded={showSuggestions && suggestions.length > 0}
        />
        {showRotatingPrompt ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-12 right-11 flex items-center overflow-hidden text-sm text-muted-foreground">
            <span className="mr-1 shrink-0">Search for</span>
            <span className="relative h-5 min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={ROTATING_SEARCHES[rotatingSearch]}
                  initial={reducedMotion ? false : { y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reducedMotion ? undefined : { y: -18, opacity: 0 }}
                  transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 truncate text-foreground/80"
                >
                  “{ROTATING_SEARCHES[rotatingSearch]}”
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
        ) : (
          <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-12 right-11 flex items-center overflow-hidden text-sm transition-colors ${active && !query ? "text-muted-foreground" : "text-transparent"}`}>
            <span className="truncate">What are you looking for?</span>
          </div>
        )}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
            >
              {suggestions.map((product, index) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => chooseProduct(product)}
                  className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 ${index === selectedIndex ? "bg-primary/10" : "hover:bg-muted"}`}
                >
                  <img
                    src={product.imageUrl.startsWith("http") ? product.imageUrl : `${import.meta.env.VITE_API_URL || ""}${product.imageUrl}`}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                    <span className="block text-xs text-muted-foreground">{product.price.toLocaleString()} RWF</span>
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
