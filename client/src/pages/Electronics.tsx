import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { 
  ChevronDown, 
  Filter, 
  ShieldCheck, 
  Clock, 
  Users, 
  Star,
  CheckCircle2,
  BadgePercent,
  TestTube2,
  Undo2,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PriceRangeSlider } from "@/components/PriceRangeSlider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Smartphones", "Phones Accessories", "Laptops", "Tablets", "Gaming Consoles", "Smartwatches", "Audio", "Cameras"];
const BRANDS = ["Apple", "Samsung", "Google", "Huawei", "Sony", "Xiaomi", "Oppo", "OnePlus", "Dell", "HP", "Lenovo", "Microsoft"];

const FILTER_GROUPS = [
  { id: "price", label: "Price Range", type: "price" },
  { id: "category", label: "Category", options: CATEGORIES },
  { id: "brand", label: "Brand", options: BRANDS },
  { id: "network", label: "Network", options: ["5G", "4G / LTE", "3G"] },
  { id: "camera", label: "Camera", options: ["48MP+", "64MP+", "108MP+"] },
  { id: "charger", label: "Charger", options: ["Included", "Not Included"] },
  { id: "color", label: "Color", options: ["Black", "White", "Blue", "Red", "Green", "Purple", "Gold", "Graphite", "Silver"] },
  { id: "condition", label: "Condition", options: ["Premium", "Excellent", "Good", "Acceptable"] },
  { id: "connectivity", label: "Connectivity", options: ["Bluetooth", "Wi-Fi", "USB-C", "Lightning"] },
  { id: "cpu", label: "CPU", options: ["Apple A-series", "Snapdragon", "Exynos", "MediaTek"] },
  { id: "ram", label: "RAM", options: ["4GB", "6GB", "8GB", "12GB"] },
  { id: "screen", label: "Screen Size", options: ["5”", "5.5”", "6”", "6.5”", "7”+"] },
  { id: "storage", label: "Storage", options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
  { id: "touchscreen", label: "Touchscreen", options: ["Touchscreen", "No Touchscreen"] },
];

export default function Electronics() {
  const { data: products, isLoading } = useProducts({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("best-selling");
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const toggleFilter = (groupId: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[groupId] || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [groupId]: updated };
    });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const term = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term));

      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      const matchesCategory = selectedFilters.category?.length 
        ? selectedFilters.category.includes(product.category) 
        : true;

      const matchesBrand = selectedFilters.brand?.length 
        ? selectedFilters.brand.includes(product.brand) 
        : true;

      return matchesSearch && matchesPrice && matchesCategory && matchesBrand;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "newest") return b.id - a.id;
      return 0;
    });
  }, [products, searchQuery, sortBy, priceRange, selectedFilters]);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {FILTER_GROUPS.map((group) => (
        <Collapsible key={group.id} defaultOpen className="border-b border-border pb-6">
          <CollapsibleTrigger className="flex w-full items-center justify-between font-bold uppercase tracking-wider text-xs hover:text-primary transition-colors">
            {group.label}
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {group.type === "price" ? (
              <div className="px-1 pt-2">
                <PriceRangeSlider
                  value={priceRange}
                  onChange={setPriceRange}
                  max={5000000}
                  step={1000}
                />
              </div>
            ) : (
              group.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${group.id}-${option}`} 
                    checked={selectedFilters[group.id]?.includes(option)}
                    onCheckedChange={() => toggleFilter(group.id, option)}
                  />
                  <label 
                    htmlFor={`${group.id}-${option}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <WhatsAppFloat />

      {/* Category Hero */}
      <section className="bg-[#0a0a0a] py-12 lg:py-16 text-white border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Certified Refurbished Electronics</h1>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-white/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>1 Year Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>30 Days Return</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>500,000+ customers</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 border border-white/10">
              <div className="text-right">
                <div className="text-sm font-bold">Excellent on Google</div>
                <div className="flex justify-end gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-3 w-3 fill-green-500 text-green-500" />
                  ))}
                </div>
              </div>
              <span className="font-bold text-white/80">Google Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Brand Quick Filter */}
        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {BRANDS.slice(0, 8).map(brand => (
              <Badge 
                key={brand}
                variant={selectedFilters.brand?.includes(brand) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => toggleFilter("brand", brand)}
              >
                {brand}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-hide">
              <FilterSidebar />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 space-y-8">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto flex flex-col p-0">
                    <SheetHeader className="p-6 border-b">
                      <SheetTitle className="text-left font-bold uppercase tracking-widest text-sm">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 p-6">
                      <FilterSidebar />
                    </div>
                    <div className="sticky bottom-0 bg-background p-6 border-t flex gap-2">
                      <Button className="flex-1" onClick={() => {}}>Apply</Button>
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedFilters({})}>Reset</Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="text-sm font-medium text-muted-foreground">
                  Showing {filteredProducts.length} results
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Best Selling</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-[4/5] rounded-xl bg-accent animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-accent p-6 mb-4">
                  <Laptop className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No products found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
                <Button variant="outline" className="mt-6" onClick={() => {
                  setPriceRange([0, 5000000]);
                  setSearchQuery("");
                  setSelectedFilters({});
                }}>Clear All Filters</Button>
              </div>
            )}

            {/* Mid-page Trust Banner */}
            <section className="rounded-3xl bg-teal-500/10 border border-teal-500/20 px-6 py-10 my-16">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold">Premium Refurbished. Trusted Quality.</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: BadgePercent, text: "Save up to 70%" },
                  { icon: CheckCircle2, text: "12 Month Warranty" },
                  { icon: TestTube2, text: "Quality Tested" },
                  { icon: Undo2, text: "Risk-Free Returns" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3">
                    <div className="rounded-full bg-teal-500/10 p-4 text-teal-600">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="prose prose-sm dark:prose-invert max-w-none pt-12 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Buying Refurbished Electronics: A Complete Guide</h2>
              <p>
                In today's fast-paced world, staying up-to-date with technology shouldn't break the bank. 
                Refurbished electronics offer a sustainable and cost-effective alternative to buying new, without compromising on quality or performance.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-lg font-bold">Benefits vs New</h3>
                  <p className="text-muted-foreground">
                    Get more for your money. A refurbished device often allows you to upgrade to a higher model 
                    or larger storage capacity that would be out of reach at full retail price.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Sustainability Messaging</h3>
                  <p className="text-muted-foreground">
                    Choosing refurbished helps reduce electronic waste and minimizes the environmental impact 
                    of manufacturing new devices. It's the green choice for tech lovers.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-12 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold">What's the difference between "Used" and "Refurbished"?</h4>
                  <p className="text-muted-foreground">Used products are sold as-is. Refurbished products are professionally tested, repaired, and certified to meet high performance standards.</p>
                </div>
                <div>
                  <h4 className="font-bold">Can I return my device if I'm not satisfied?</h4>
                  <p className="text-muted-foreground">Yes! We offer a risk-free 30-day return policy on all our certified refurbished electronics.</p>
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
