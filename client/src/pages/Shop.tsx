import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { useProducts } from "@/hooks/use-products";
import { Search, Filter, SlidersHorizontal, ChevronDown, X, SlidersVertical } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LAPTOP_OPTIONS = {
  batteryHealth: ["100%", "90%+", "80%+"],
  charger: ["Included", "Not Included"],
  color: ["Aluminum", "Black", "Carbon Fiber", "Gold", "Gray", "Matte Black"],
  condition: ["Premium", "Excellent", "Good", "Acceptable"],
  cpu: ["Apple M1 / M2 / M3", "Intel i3 / i5 / i7 / i9", "AMD Ryzen"],
  ram: ["8GB", "16GB", "32GB", "64GB"],
  screenSize: ["12\"", "13\"", "14\"", "15\"", "16\""],
  storage: ["128GB", "256GB", "512GB", "1TB", "2TB"],
  touchBar: ["Touch Bar", "No Touch Bar"]
};

export default function Shop() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch(); // reactive — updates whenever search params change
  const searchParams = new URLSearchParams(rawSearch);
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "All";

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [category, setCategory] = useState<string>(urlCategory);
  const [laptopFilters, setLaptopFilters] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5_000_000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // Sync state whenever URL search params change (e.g. slide-out nav clicks)
  useEffect(() => {
    setSearchTerm(urlSearch);
    setCategory(urlCategory);
  }, [rawSearch]);

  const { data: allProducts, isLoading } = useProducts({ 
    search: searchTerm, 
    category: category === "All" ? undefined : category 
  });

  const availableBrands = useMemo(() => {
    if (!allProducts) return [];
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
    return brands;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    // Client-side search filtering (case-insensitive)
    let results = allProducts;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
      );
    }

    // Price range filter
    results = results.filter(product => {
      const price = product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Brand filter
    if (selectedBrands.length > 0) {
      results = results.filter(product => selectedBrands.includes(product.brand));
    }

    if (category !== "Laptops" || Object.keys(laptopFilters).length === 0) return results;

    return results.filter(product => {
      const specs = product.specs as Record<string, string> || {};
      return Object.entries(laptopFilters).every(([key, values]) => {
        if (values.length === 0) return true;
        return values.includes(specs[key]);
      });
    });
  }, [allProducts, searchTerm, category, laptopFilters, priceRange, selectedBrands]);

  const updateUrl = (newSearch: string, newCategory: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newCategory && newCategory !== "All") params.set("category", newCategory);

    const queryString = params.toString();
    setLocation(queryString ? `/shop?${queryString}` : "/shop");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateUrl(value, category);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setLaptopFilters({});
    setSelectedBrands([]);
    setPriceRange([0, 5_000_000]);
    updateUrl(searchTerm, cat);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const hasActiveFilters = selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 5_000_000 || Object.keys(laptopFilters).some(k => laptopFilters[k].length > 0);

  const toggleLaptopFilter = (key: string, value: string) => {
    setLaptopFilters(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const categories = [
    "All",
    "Smartphones",
    "Phones Accessories",
    "Laptops",
    "Laptop Accessories",
    "Tablets",
    "Gaming",
    "Gaming Accessories",
    "Audio",
    "Cameras",
    "Camera Accessories",
    "Smartwatches",
  ];

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IFIX",
    "url": "https://ifix.rw",
    "logo": "https://ifix.rw/ifix-logo.png",
    "description": "Premium electronics retailer in Kigali, Rwanda.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+250788442127",
      "contactType": "customer service",
      "availableLanguage": ["English", "French", "Kinyarwanda"]
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "IFIX",
    "url": "https://ifix.rw",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://ifix.rw/shop?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Shop — IFIX | Buy Electronics in Kigali, Rwanda</title>
        <meta name="description" content="Browse smartphones, laptops, tablets, audio, gaming gear and more. Certified electronics with 12-month warranty and fast delivery in Kigali." />
        <link rel="canonical" href={urlCategory && urlCategory !== 'All' ? `https://ifix.rw/shop?category=${encodeURIComponent(urlCategory)}` : 'https://ifix.rw/shop'} />
        <meta name="robots" content={urlSearch ? 'noindex, follow' : 'index, follow'} />
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />

      {/* Header — desktop only */}
      <div className="hidden lg:block bg-card border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
          <h1 className="text-4xl font-bold text-foreground">Our Shop</h1>
          <p className="mt-2 text-base text-muted-foreground">Discover premium electronics at unbeatable prices.</p>
        </div>
      </div>

      {/* Mobile top bar — search + filter button */}
      <div className="lg:hidden px-3 pt-3 pb-1 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${hasActiveFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">{selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < 5_000_000 ? 1 : 0)}</span>}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-left text-base font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 pt-4">
                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h3>
                    {(priceRange[0] > 0 || priceRange[1] < 5_000_000) && (
                      <button onClick={() => setPriceRange([0, 5_000_000])} className="text-[10px] text-primary hover:underline">Reset</button>
                    )}
                  </div>
                  <PriceRangeSlider value={priceRange} onChange={(v) => setPriceRange(v as [number, number])} min={0} max={5_000_000} step={10_000} />
                </div>
                {/* Brand */}
                {availableBrands.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</h3>
                      {selectedBrands.length > 0 && (
                        <button onClick={() => setSelectedBrands([])} className="text-[10px] text-primary hover:underline">Clear</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableBrands.map(brand => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${selectedBrands.includes(brand) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Laptop filters */}
                {category === "Laptops" && (
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Laptop Filters</h3>
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(LAPTOP_OPTIONS).map(([key, options]) => (
                        <AccordionItem key={key} value={key} className="border-none">
                          <AccordionTrigger className="py-2 text-sm font-semibold capitalize hover:no-underline">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {options.map(option => (
                                <button
                                  key={option}
                                  onClick={() => toggleLaptopFilter(key, option)}
                                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${laptopFilters[key]?.includes(option) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
                {/* Reset all */}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSelectedBrands([]); setPriceRange([0, 5_000_000]); setLaptopFilters({}); }}
                    className="w-full rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-600 py-2 text-sm font-semibold"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile categories pills */}
        <div className="flex overflow-x-auto gap-1.5 pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-accent text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Content */}
      <div className="mx-auto max-w-7xl px-2 py-3 lg:py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row">

          {/* Sidebar Filters — desktop only */}
          <aside className="hidden lg:block w-full space-y-6 lg:w-64 lg:shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card/50 backdrop-blur-md py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h3>
                {(priceRange[0] > 0 || priceRange[1] < 5_000_000) && (
                  <button
                    onClick={() => setPriceRange([0, 5_000_000])}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <PriceRangeSlider
                value={priceRange}
                onChange={(v) => setPriceRange(v as [number, number])}
                min={0}
                max={5_000_000}
                step={10_000}
              />
            </div>

            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</h3>
                  {selectedBrands.length > 0 && (
                    <button
                      onClick={() => setSelectedBrands([])}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableBrands.map(brand => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onCheckedChange={() => toggleBrand(brand)}
                      />
                      <label
                        htmlFor={`brand-${brand}`}
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                      >
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-2 lg:space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categories</h3>
              {/* Mobile: single-row horizontal scroll */}
              <div className="flex overflow-x-auto gap-1.5 pb-1 lg:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      category === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-accent text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Desktop: vertical list */}
              <div className="hidden lg:flex lg:flex-col lg:gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 w-full ${
                      category === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Laptop Specific Filters */}
            {category === "Laptops" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Laptop Filters</h3>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(LAPTOP_OPTIONS).map(([key, options]) => (
                    <AccordionItem key={key} value={key} className="border-none">
                      <AccordionTrigger className="py-2 text-sm font-semibold capitalize hover:no-underline">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-1">
                          {options.map(option => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`filter-${key}-${option}`}
                                checked={laptopFilters[key]?.includes(option)}
                                onCheckedChange={() => toggleLaptopFilter(key, option)}
                              />
                              <label 
                                htmlFor={`filter-${key}-${option}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
               <div className="grid grid-cols-4 gap-1.5 sm:gap-3 lg:grid-cols-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="aspect-square rounded-xl bg-accent animate-pulse" />
                ))}
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Filter className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">No products found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                <button 
                  onClick={() => { setSearchTerm(""); setCategory("All"); setLaptopFilters({}); setSelectedBrands([]); setPriceRange([0, 5_000_000]); setLocation("/shop"); }}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3 lg:grid-cols-5">
                {filteredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
