import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import { Input } from "@/components/ui/input";
import { 
  Filter, 
  ShieldCheck,
  RotateCcw,
  Users,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function Gaming() {
  const { data: products, isLoading } = useProducts();
  
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("best-selling");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "name": "IFIX - Gaming",
    "url": "https://ifix.rw/gaming",
    "telephone": "+250788442127",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "KN 48 St",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    }
  };

  const categories = [
    "Gaming", "Gaming Headsets", "Gaming Mouse", "Gaming Accessories", 
    "Gaming Keyboards", "Gaming Consoles", "PlayStation & Consoles"
  ];
  const brands = ["Razer", "SteelSeries", "Glorious", "Dell", "RIG", "Lexar", "SanDisk", "Asus", "Valve", "Microsoft"];
  const colors = ["Black", "Black (Red Switch)", "Black RGB", "Black/Green", "Carbon Black", "Central Red", "Chroma (Black)", "Clear", "Dark Side of the Moon"];
  const conditions = ["Acceptable", "Brand New", "Excellent", "Premium"];
  const storageOptions = ["128GB", "1TB", "256GB", "512GB"];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(p => {
      const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const colorMatch = selectedColors.length === 0 || (p.specs?.Color && selectedColors.includes(p.specs.Color as string));
      const conditionMatch = selectedConditions.length === 0 || selectedConditions.includes(p.stockStatus === "in_stock" ? "Brand New" : "Excellent");
      const storageMatch = selectedStorage.length === 0 || (p.specs?.Storage && selectedStorage.includes(p.specs.Storage as string));
      
      // Only show gaming-related categories
      const isGamingProduct = categories.includes(p.category);
      
      return isGamingProduct && priceMatch && categoryMatch && brandMatch && colorMatch && conditionMatch && storageMatch;
    });

    switch (sortBy) {
      case "price-low-high":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "price-high-low":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "newest":
        return [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
      default:
        return filtered;
    }
  }, [products, priceRange, selectedCategories, selectedBrands, selectedColors, selectedConditions, selectedStorage, sortBy]);

  const FilterSection = () => (
    <div className="space-y-8">
      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Price Range</h3>
        <PriceRangeSlider
          value={priceRange}
          onChange={setPriceRange}
          max={5000000}
          step={1000}
        />
      </div>

      {/* Category */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Category</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox 
                id={`cat-${cat}`} 
                checked={selectedCategories.includes(cat)}
                onCheckedChange={(checked) => {
                  setSelectedCategories(prev => 
                    checked ? [...prev, cat] : prev.filter(c => c !== cat)
                  );
                }}
              />
              <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none cursor-pointer">
                {cat}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Brand</h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox 
                id={`brand-${brand}`} 
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  setSelectedBrands(prev => 
                    checked ? [...prev, brand] : prev.filter(b => b !== brand)
                  );
                }}
              />
              <label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none cursor-pointer">
                {brand}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Color</h3>
        <div className="space-y-2">
          {colors.map(color => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox 
                id={`color-${color}`} 
                checked={selectedColors.includes(color)}
                onCheckedChange={(checked) => {
                  setSelectedColors(prev => 
                    checked ? [...prev, color] : prev.filter(c => c !== color)
                  );
                }}
              />
              <label htmlFor={`color-${color}`} className="text-sm font-medium leading-none cursor-pointer">
                {color}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Condition</h3>
        <div className="space-y-2">
          {conditions.map(cond => (
            <div key={cond} className="flex items-center space-x-2">
              <Checkbox 
                id={`cond-${cond}`} 
                checked={selectedConditions.includes(cond)}
                onCheckedChange={(checked) => {
                  setSelectedConditions(prev => 
                    checked ? [...prev, cond] : prev.filter(c => c !== cond)
                  );
                }}
              />
              <label htmlFor={`cond-${cond}`} className="text-sm font-medium leading-none cursor-pointer">
                {cond}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Storage */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Storage</h3>
        <div className="space-y-2">
          {storageOptions.map(opt => (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox 
                id={`storage-${opt}`} 
                checked={selectedStorage.includes(opt)}
                onCheckedChange={(checked) => {
                  setSelectedStorage(prev => 
                    checked ? [...prev, opt] : prev.filter(o => o !== opt)
                  );
                }}
              />
              <label htmlFor={`storage-${opt}`} className="text-sm font-medium leading-none cursor-pointer">
                {opt}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      {/* Category Hero */}
      <section className="bg-slate-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold">Certified Refurbished Gaming</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> 1 Year Warranty</span>
                <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 text-primary" /> 30 Days Return</span>
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> 500,000+ customers</span>
              </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center md:text-right">
              <p className="text-sm font-medium text-slate-400 mb-1">Excellent on Google</p>
              <div className="flex items-center justify-center md:justify-end gap-1 mb-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-green-500 p-0.5 rounded-sm">
                    <Star className="w-3 h-3 fill-white text-white" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wider">GOOGLE REVIEWS</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-hide">
            <FilterSection />
          </aside>

          {/* Right Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 min-w-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 min-w-0 flex-1 scrollbar-hide">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden shrink-0">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                    <div className="py-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Filters</h2>
                      </div>
                      <FilterSection />
                      <div className="sticky bottom-0 bg-background pt-6 border-t mt-8 flex gap-2">
                        <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                        <Button variant="outline" onClick={() => {
                          setPriceRange([0, 5000000]);
                          setSelectedCategories([]);
                          setSelectedBrands([]);
                          setSelectedColors([]);
                          setSelectedConditions([]);
                          setSelectedStorage([]);
                          setIsFilterOpen(false);
                        }}>Reset</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                {/* Brand Quick Filters */}
                {brands.map(brand => (
                  <Badge 
                    key={brand}
                    variant={selectedBrands.includes(brand) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => {
                      setSelectedBrands(prev => 
                        prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                      );
                    }}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>

              <div className="w-full sm:w-auto flex justify-end">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Best Selling</SelectItem>
                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} className="aspect-[3/4] rounded-xl bg-accent animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-accent/20 rounded-2xl border border-dashed">
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to find what you're looking for.</p>
                <Button 
                  variant="ghost" 
                  className="mt-4"
                  onClick={() => {
                    setPriceRange([0, 5000000]);
                    setSelectedCategories([]);
                    setSelectedBrands([]);
                    setSelectedColors([]);
                    setSelectedConditions([]);
                    setSelectedStorage([]);
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Mid-Page Trust Banner */}
            <section className="bg-teal-50 dark:bg-teal-950/20 rounded-2xl p-8 border border-teal-100 dark:border-teal-900/30">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-teal-900 dark:text-teal-400">Premium Refurbished. Trusted Quality.</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500 p-0.5 rounded-sm">
                        <Star className="w-3 h-3 fill-white text-white" />
                      </div>
                      <span className="font-bold text-sm">Google Reviews</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-[2]">
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-400">Save up to 70%</p>
                    <p className="text-xs text-teal-700 dark:text-teal-500">Vs brand new price</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-400">12 Months Warranty</p>
                    <p className="text-xs text-teal-700 dark:text-teal-500">On every purchase</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-400">Quality Tested</p>
                    <p className="text-xs text-teal-700 dark:text-teal-500">By our expert technicians</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-400">30-Day Trial</p>
                    <p className="text-xs text-teal-700 dark:text-teal-500">Risk-free shopping</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-400">Save CO₂</p>
                    <p className="text-xs text-teal-700 dark:text-teal-500">Sustainable tech choice</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="prose prose-slate dark:prose-invert max-w-none pt-12 border-t">
              <h2 className="text-3xl font-bold mb-6">Buy Refurbished Gaming Gear in Australia</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Level up your gaming setup with premium refurbished gear from the world's leading brands. 
                    At Reebelo, we offer a vast collection of gaming headsets, mice, keyboards, and consoles 
                    from Razer, SteelSeries, Asus, and more, all at prices that won't break the bank.
                  </p>
                  <p>
                    Whether you're looking for a high-performance PlayStation console or a precision gaming mouse, 
                    each product undergoes meticulous quality control testing. Our technicians verify everything from 
                    button responsiveness to sensor accuracy, ensuring your gear is ready for competitive play.
                  </p>
                </div>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <h3 className="text-xl font-bold text-foreground">Performance meet Sustainability</h3>
                  <p>
                    By choosing refurbished gaming gear, you're not just getting a great deal—you're also making an 
                    eco-conscious decision. Reducing e-waste is vital, and our mission is to extend the lifecycle of 
                    high-performance hardware while delivering the same great experience as new.
                  </p>
                  <p>
                    All gaming gear is backed by a 12-month warranty and a 30-day risk-free trial. Enjoy fast shipping 
                    and expert support as you build the ultimate gaming station sustainably.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
