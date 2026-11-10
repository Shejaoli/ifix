import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { 
  ChevronDown, 
  Filter, 
  X, 
  ShieldCheck, 
  Clock, 
  Users, 
  Star,
  CheckCircle2,
  BadgePercent,
  TestTube2,
  Undo2
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
import { motion, AnimatePresence } from "framer-motion";

const FILTER_GROUPS = [
  {
    id: "price",
    label: "Price Range",
    type: "price",
  },
  {
    id: "battery",
    label: "Battery Health",
    options: ["100%", "90%+", "80%+"],
  },
  {
    id: "carrier",
    label: "Carrier",
    options: ["Fully Unlocked"],
  },
  {
    id: "color",
    label: "Color",
    options: ["Black", "White", "Gold", "Blue", "Green", "Graphite", "Silver", "Space Gray", "Midnight", "Starlight", "Pacific Blue", "Sierra Blue", "Deep Purple"],
  },
  {
    id: "condition",
    label: "Condition",
    options: ["Premium", "Excellent", "Good", "Acceptable"],
  },
  {
    id: "sim",
    label: "SIM Slot",
    options: ["Dual SIM", "Single SIM + eSIM"],
  },
  {
    id: "storage",
    label: "Storage",
    options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  },
];

export default function Iphones() {
  const { data: products, isLoading } = useProducts({ category: "Smartphones" });
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
      // Filter by brand Apple (since this is the iPhone page)
      if (product.brand !== "Apple") return false;

      // Basic text search
      const term = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term));

      // Price filter
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      // Category/Brand is already handled by API call, but we can add more state-based filters here
      // For a real app, these would ideally be backend filters, but per instructions we handle via state

      return matchesSearch && matchesPrice;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "newest") return b.id - a.id;
      return 0; // best-selling default
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
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Certified Refurbished iPhones</h1>
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
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-left font-bold uppercase tracking-widest text-sm">Filters</SheetTitle>
                    </SheetHeader>
                    <FilterSidebar />
                    <div className="sticky bottom-0 bg-background pt-4 mt-6 border-t flex gap-2">
                      <Button className="flex-1" onClick={() => {}}>Apply</Button>
                      <Button variant="outline" className="flex-1">Reset</Button>
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
                  <Smartphone className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No iPhones found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search query.</p>
                <Button variant="outline" className="mt-6" onClick={() => {
                  setPriceRange([0, 5000000]);
                  setSearchQuery("");
                  setSelectedFilters({});
                }}>Clear All Filters</Button>
              </div>
            )}

            {/* Mid-page Trust Banner */}
            <section className="rounded-3xl bg-primary/5 border border-primary/10 px-6 py-10 my-16">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold">Premium Refurbished. Trusted Quality.</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: BadgePercent, text: "Save up to 70%" },
                  { icon: CheckCircle2, text: "12 Month Warranty" },
                  { icon: TestTube2, text: "Quality Tested by Experts" },
                  { icon: Undo2, text: "Risk-Free 30-Day Trial" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3">
                    <div className="rounded-full bg-primary/10 p-4 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="prose prose-sm dark:prose-invert max-w-none pt-12 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Why Buy a Refurbished iPhone from IFIX?</h2>
              <p>
                Buying a certified refurbished iPhone is the smartest way to get premium technology at a fraction of the cost. 
                Our iPhones undergo rigorous 70-point quality checks to ensure every component, from the battery to the display, 
                performs exactly like new.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div>
                  <h3 className="text-lg font-bold">What is IFIX Certified?</h3>
                  <p className="text-muted-foreground">
                    Every iPhone we sell is processed by expert technicians. We verify authenticity, clear all data, 
                    and test functionality including Face ID, cameras, and network connectivity.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold">Sustainable Choice</h3>
                  <p className="text-muted-foreground">
                    Choosing refurbished isn't just good for your wallet—it's good for the planet. 
                    Extending the life of a smartphone reduces electronic waste and carbon footprint.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-12 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold">What is the battery health of refurbished iPhones?</h4>
                  <p className="text-muted-foreground">We guarantee a minimum of 80% battery health, with many devices featuring 90% or even 100% health.</p>
                </div>
                <div>
                  <h4 className="font-bold">Are these iPhones unlocked?</h4>
                  <p className="text-muted-foreground">Yes, all our iPhones are fully unlocked and can be used with any carrier worldwide.</p>
                </div>
                <div>
                  <h4 className="font-bold">Does it come with original packaging?</h4>
                  <p className="text-muted-foreground">To reduce waste and costs, we use custom IFIX eco-friendly packaging, but we include a high-quality charging cable with every purchase.</p>
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

import { Smartphone } from "lucide-react";
