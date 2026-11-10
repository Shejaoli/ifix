import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Product } from "@shared/schema";
import {
  ArrowRight,
  Check,
  Flame,
  Filter,
  Search,
  Shield,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import { getProductPricing } from "@shared/product-pricing";
import { getResponsiveImageProps } from "@/lib/responsive-image";

const formatRwf = (amount: number) =>
  `${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(amount)} RWF`;

function SpotlightDeal({ product }: { product: Product }) {
  const { discount, salePrice } = getProductPricing(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      aria-label={`Shop ${product.name}${discount ? ` and save ${discount}%` : ""}`}
      className="group relative flex min-w-[82vw] snap-start items-center gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white p-3 text-slate-900 shadow-[0_8px_24px_rgba(2,19,51,0.16)] transition hover:-translate-y-0.5 hover:shadow-xl sm:min-w-0 sm:p-4"
    >
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28">
        <img
          src={product.imageUrl || "/placeholder.png"}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          onError={(event) => { event.currentTarget.src = "/placeholder.png"; }}
          {...getResponsiveImageProps(product.imageUrl || "/placeholder.png", "96px")}
        />
        {discount > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
            -{discount}%
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          <Flame className="h-3 w-3 fill-current" /> Spotlight deal
        </p>
        <h2 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{product.name}</h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {discount > 0 && <span className="text-xs text-slate-400 line-through">{formatRwf(product.price)}</span>}
          <span className="text-base font-black text-primary sm:text-lg">{formatRwf(salePrice)}</span>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-700 transition group-hover:text-primary">
          Shop this deal <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export default function Deals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Deals");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5_000_000]);

  const { data: hotDeals, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/hot-deals"],
  });

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: "IFIX",
    url: "https://ifix.rw",
    telephone: "+250788442127",
    address: {
      "@type": "PostalAddress",
      streetAddress: "KN 48 St",
      addressLocality: "Kigali",
      addressCountry: "RW",
    },
  };

  const products = hotDeals ?? [];
  const categories = ["All Deals", ...Array.from(new Set(products.map((product) => product.category))).sort()];
  const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();
  const topDiscount = Math.max(0, ...products.map((product) => getProductPricing(product).discount));
  const spotlightProducts = products.slice(0, 3);

  const filteredDeals = useMemo(() => products.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    if (query && !`${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query)) return false;
    if (category !== "All Deals" && product.category !== category) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
    const { salePrice } = getProductPricing(product);
    if (salePrice < priceRange[0] || salePrice > priceRange[1]) return false;
    return true;
  }), [products, searchTerm, category, selectedBrands, priceRange]);

  const toggleBrand = (brand: string, checked: boolean) => {
    setSelectedBrands((current) => checked
      ? [...current, brand]
      : current.filter((item) => item !== brand));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("All Deals");
    setSelectedBrands([]);
    setPriceRange([0, 5_000_000]);
  };

  const FilterContent = () => (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]">Filter deals</h2>
        <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">Reset</button>
      </div>
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</h3>
        <div className="space-y-2.5">
          {categories.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox checked={category === item} onCheckedChange={() => setCategory(item)} aria-label={item} />
              <span className={category === item ? "font-semibold text-foreground" : "text-muted-foreground"}>{item}</span>
            </label>
          ))}
        </div>
      </div>
      {brands.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Brand</h3>
          <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox checked={selectedBrands.includes(brand)} onCheckedChange={(checked) => toggleBrand(brand, checked === true)} aria-label={brand} />
                <span className="text-muted-foreground">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Price range</h3>
        <PriceRangeSlider value={priceRange} onChange={setPriceRange} max={5_000_000} step={10_000} className="mt-2" />
      </div>
    </div>
  );

  const activeFilterCount = selectedBrands.length + (category !== "All Deals" ? 1 : 0) + (searchTerm.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Hot Deals on Electronics | IFIX Rwanda</title>
        <meta name="description" content="Shop current deals on certified electronics in Rwanda. Find discounted phones, audio, laptops, gaming gear and more at IFIX." />
        <meta property="og:title" content="Hot Deals on Electronics | IFIX" />
        <meta property="og:description" content="Shop current deals on phones, laptops, audio and gaming gear in Kigali." />
        <meta property="og:url" content="https://ifix.rw/deals" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://ifix.rw/deals" />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      <main>
        <section aria-label="Deals and shopping information" className="overflow-hidden bg-red-600 text-white">
          <div className="flex w-max animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-6 px-4 py-2 text-xs font-extrabold sm:gap-10 sm:px-6 sm:py-2.5 sm:text-sm">
                <span className="whitespace-nowrap">1-Year Warranty Guarantee</span>
                <span aria-hidden="true" className="text-white/80">✦</span>
                <span className="whitespace-nowrap">{topDiscount > 0 ? `Up to ${topDiscount}% off selected deals` : "Great prices on selected electronics"}</span>
                <span aria-hidden="true" className="text-white/80">✦</span>
                <a href="#all-deals-heading" className="whitespace-nowrap underline decoration-white/50 underline-offset-2 hover:text-white/80">Don’t miss out — shop the deals</a>
                <span aria-hidden="true" className="text-white/80">✦</span>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-[#07373d] via-[#007e85] to-[#6556a5] text-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-teal-300/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="relative mx-auto max-w-[1400px] px-4 pb-7 pt-7 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-yellow-300">
                  <span className="real-fire" aria-hidden="true">
                    <Flame className="real-fire__outer" />
                    <Flame className="real-fire__inner" />
                  </span>
                  IFIX deals
                </span>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Hot Deals</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-100 sm:text-base">
                  Great prices on the tech you want. Shop this week’s offers while they last.
                </p>
                {topDiscount > 0 && (
                  <p className="mt-3 inline-flex items-center rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-extrabold text-slate-950">
                    Save up to {topDiscount}% on selected products
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-teal-100 sm:pb-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10"><Check className="h-4 w-4 text-yellow-300" /></span>
                Kigali delivery available
              </div>
            </div>

            {spotlightProducts.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-100">Spotlight deals</h2>
                  <span className="text-[11px] text-teal-100/80">Swipe to explore <ArrowRight className="ml-1 inline h-3 w-3" /></span>
                </div>
                <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
                  {spotlightProducts.map((product) => <SpotlightDeal key={product.id} product={product} />)}
                </div>
              </div>
            )}
          </div>
        </section>

        <nav aria-label="Deal categories" className="sticky top-[88px] z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur-xl xl:top-16">
          <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition sm:px-5 sm:text-sm ${category === item
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <section aria-labelledby="all-deals-heading" className="mx-auto max-w-[1400px] px-3 py-6 sm:px-6 sm:py-9 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Find your next favorite</p>
              <h2 id="all-deals-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">All deals</h2>
              {!isLoading && <p className="mt-1 text-sm text-muted-foreground">{filteredDeals.length} {filteredDeals.length === 1 ? "offer" : "offers"} to explore</p>}
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:min-w-[390px]">
              <label className="relative min-w-0 flex-1">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search deals or brands"
                  aria-label="Search deals or brands"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/75 focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-11 shrink-0 gap-2 rounded-xl px-3 font-semibold lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-5">
                  <FilterContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-7">
            <aside className="hidden rounded-2xl border border-border bg-card p-5 shadow-sm lg:block">
              <FilterContent />
            </aside>
            <div className="min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {Array.from({ length: 10 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />)}
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Filter className="h-5 w-5" /></span>
                  <h3 className="text-lg font-bold">No deals match these filters</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try another category or clear your search and filters.</p>
                  <Button type="button" variant="outline" onClick={clearFilters} className="mt-4 rounded-xl">Clear filters <X className="ml-2 h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
                  {filteredDeals.map((product) => <ProductCard key={product.id} product={product} isDeal />)}
                </div>
              )}
            </div>
          </div>
        </section>

        <section aria-label="IFIX shopping benefits" className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-[1400px] grid-cols-3 gap-2 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield className="h-4 w-4" /></span>
              <span className="text-[10px] font-bold sm:text-sm">Warranty included</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Check className="h-4 w-4" /></span>
              <span className="text-[10px] font-bold sm:text-sm">Quality checked</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck className="h-4 w-4" /></span>
              <span className="text-[10px] font-bold sm:text-sm">Delivery across Rwanda</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
