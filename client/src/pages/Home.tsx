import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useState, useEffect, useRef, useCallback } from "react";
function useTouchSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 10) e.preventDefault();
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) onSwipeLeft();
      else onSwipeRight();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [onSwipeLeft, onSwipeRight]);
  return { onTouchStart, onTouchMove, onTouchEnd };
}
import { useQuery } from "@tanstack/react-query";
import { CouponCode } from "@shared/schema";
import { getProductPricing } from "@shared/product-pricing";
import { getResponsiveImageProps } from "@/lib/responsive-image";

import { 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Gamepad2,
  Headphones,
  Wrench,
  Monitor,
  Trash2,
  Tv,
  Users,
  Timer,
  Volume2,
  VolumeX,
  Check,
  MapPin,
  Zap,
  Sparkles,
  Play,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Category Images
import smartphonesCat from "@assets/Phone_category_1768723350746.webp";
import laptopsCat from "@assets/Laptop_category_1768723909466.webp";
import tabletsCat from "@assets/tablet_category_1768724210189.webp";
import watchesCat from "@assets/smartwatches_category_1768746560605.webp";
import gamingCat from "@assets/Gaming_category_1768746932352.webp";
import audioCat from "@assets/Audio_category_1768748035466.webp";
import accessoriesCat from "@assets/Accessoirs_category_1768748494801.webp";
import electronicsCat from "@assets/Electronics_category_1768749381858.webp";

const HomeHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const slides = [
    {
      src: "/images/hero-smartphones-bestseller.webp?v=2",
      alt: "Upgrade to a bestseller. Shop the phones everyone is talking about at IFIX in Kigali.",
      href: "/shop?category=Smartphones",
    },
    {
      src: "/images/hero-premium-laptops.webp?v=2",
      alt: "Premium laptops for every need. Work, create, learn, and play.",
      href: "/shop?category=Laptops",
    },
    {
      src: "/images/hero-laptops-every-need.webp?v=2",
      alt: "Premium laptops for every need, with performance, displays, and reliable quality.",
      href: "/shop?category=Laptops",
    },
    {
      src: "/images/hero-gaming-consoles.webp?v=2",
      alt: "Gaming accessories and consoles. Play, explore, and level up.",
      href: "/shop?category=Gaming",
    },
  ];

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [prefersReducedMotion, slides.length]);

  return (
    <section aria-label="Featured electronics promotion" className="imigongo-pattern imigongo-triangles w-full px-3 py-2 sm:px-5 sm:py-3 lg:px-6">
      <div className="relative mx-auto aspect-[1203/379] w-full max-w-[1200px] overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(18,39,71,0.12)] ring-1 ring-black/5">
        <Link href={slides[activeSlide].href} aria-label={`Shop ${slides[activeSlide].alt}`} className="absolute inset-0 block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-inset">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={slides[activeSlide].src}
              src={slides[activeSlide].src}
              alt={slides[activeSlide].alt}
              width={1203}
              height={379}
              fetchPriority={activeSlide === 0 ? "high" : "auto"}
              loading={activeSlide === 0 ? "eager" : "lazy"}
              decoding="async"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="block h-full w-full object-cover object-center"
            />
          </AnimatePresence>
        </Link>
        <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/85 p-1 shadow-sm backdrop-blur-sm" role="group" aria-label="Choose promotion slide">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show promotion ${index + 1}`}
              aria-pressed={activeSlide === index}
              className={`h-1.5 rounded-full transition-all ${activeSlide === index ? "w-5 bg-primary" : "w-1.5 bg-slate-400 hover:bg-primary/70"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturedPosterMarquee = () => {
  const prefersReducedMotion = useReducedMotion();
  const posters = [
    {
      title: "IFIX — Your Trusted Tech Store in Kigali",
      image: "/images/ifix-trusted-store-man.webp",
      href: "/shop",
    },
    {
      title: "DJI Mic Mini — wireless microphone for creators",
      image: "/images/dji-mic-mini-promo.webp",
      href: "/shop?search=DJI%20Mic%20Mini",
    },
    {
      title: "IFIX — trusted technology and support in Kigali",
      image: "/images/ifix-trusted-store-woman.webp",
      href: "/shop",
    },
    {
      title: "AirPods Max — immersive sound and exceptional comfort",
      image: "/images/airpods-max-promo.webp",
      href: "/shop?search=AirPods%20Max",
    },
    {
      title: "AirPods Series — premium sound and seamless connection",
      image: "/images/airpods-series-promo.webp",
      href: "/shop?search=AirPods",
    },
  ];

  return (
    <section aria-labelledby="featured-promos-title" className="imigongo-pattern imigongo-labyrinth overflow-hidden border-y border-slate-100 bg-slate-50/70 py-5 sm:py-7">
      <div className="mb-3 px-4 sm:mx-auto sm:mb-4 sm:max-w-[1200px] sm:px-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">IFIX picks</p>
        <h2 id="featured-promos-title" className="mt-0.5 text-lg font-bold text-foreground sm:text-xl">Featured promotions</h2>
      </div>
      <div className="promo-marquee-viewport overflow-hidden px-3 sm:px-5 lg:px-6">
        <div className={`promo-marquee-track flex w-max ${prefersReducedMotion ? "promo-marquee-static" : ""}`}>
          {[false, true].map((isDuplicate) => (
            <div key={String(isDuplicate)} aria-hidden={isDuplicate || undefined} className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
              {posters.map((poster) => (
                <Link
                  key={poster.title}
                  href={poster.href}
                  aria-label={`View ${poster.title}`}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="group block w-[min(43vw,180px)] shrink-0 overflow-hidden rounded-xl bg-white shadow-[0_4px_16px_rgba(18,39,71,0.10)] ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(18,39,71,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-[clamp(185px,18vw,228px)] sm:rounded-2xl"
                >
                  <img
                    src={poster.image}
                    alt={poster.title}
                    width="1000"
                    height="1095"
                    loading="lazy"
                    decoding="async"
                    className="aspect-[.91] w-full bg-white object-contain transition-transform duration-300 group-hover:scale-[1.015]"
                    {...getResponsiveImageProps(poster.image, "(max-width: 640px) 43vw, 228px")}
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const trustItems = [
  { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "12-Month Warranty", sub: "Genuine protection", color: "bg-primary/10 text-primary" },
  { icon: <Check className="w-3.5 h-3.5" />, label: "Quality Checked", sub: "Rigorously tested", color: "bg-primary/10 text-primary" },
  { icon: <MapPin className="w-3.5 h-3.5" />, label: "Kigali Support", sub: "Local expert help", color: "bg-primary/10 text-primary" },
  { icon: <Star className="w-3.5 h-3.5 fill-yellow-600" />, label: "4.7 Google Reviews", sub: "Trusted by thousands", color: "bg-yellow-400/10 text-yellow-600" },
];

const TrustBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 border-b relative z-30"
    >
      <div className="overflow-hidden py-1.5" aria-label="Store benefits">
        <div className="mx-auto max-w-[1200px] overflow-hidden">
          <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ width: "max-content" }}>
            {[...trustItems, ...trustItems].map((item, i) => (
              <div key={`${item.label}-${i}`} aria-hidden={i >= trustItems.length} className="flex shrink-0 items-center gap-1.5 px-5 sm:px-8">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex flex-col whitespace-nowrap">
                  <span className="text-[10px] font-bold leading-tight sm:text-[11px]">{item.label}</span>
                  <span className="text-[8px] leading-tight text-muted-foreground/70 sm:text-[9px]">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
const RecommendedProducts = () => {
  const { data: allProducts } = useProducts();
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [recommendationReason, setRecommendationReason] = useState<string | null>(null);

  useEffect(() => {
    const viewedIdsStr = localStorage.getItem("recentlyViewed");
    if (viewedIdsStr && allProducts) {
      const viewedIds = JSON.parse(viewedIdsStr) as number[];
      // Get the 6 most recent unique products
      const products = viewedIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 6);
      
      setRecentlyViewed(products);
      
      if (products.length > 0) {
        setRecommendationReason(`Because you viewed ${products[0]?.name || "these products"}`);
      }
    }
  }, [allProducts]);

  // Fallback to "Popular in Kigali" (Featured) or "Best Value" (Deals)
  const displayProducts = recentlyViewed.length > 0 
    ? recentlyViewed 
    : allProducts?.filter(p => p.isFeatured || p.category === "Deals").slice(0, 6) || [];

  if (displayProducts.length === 0) return null;

  return (
    <section className="imigongo-pattern imigongo-circles py-5 sm:py-8 border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          {recommendationReason && recentlyViewed.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium italic">
              <RotateCcw className="w-3 h-3 text-primary" /> {recommendationReason}
            </p>
          )}
          {!recommendationReason && (
            <p className="text-xs text-muted-foreground mt-1 font-medium italic">
              Popular in Kigali • Best value today
            </p>
          )}
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {displayProducts.map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
          </div>
        </Carousel>
      </div>
    </section>
  );
};
const PopularCategories = () => {
  const categories = [
    { name: "Smartphones", image: smartphonesCat, href: "/shop?category=Smartphones", description: "New & Refurbished" },
    { name: "Laptops", image: laptopsCat, href: "/shop?category=Laptops", description: "Power & Portability" },
    { name: "Tablets", image: tabletsCat, href: "/shop?category=Tablets", description: "On the go or on the fly" },
    { name: "Smartwatches", image: watchesCat, href: "/shop?category=Smartwatches", description: "Stay connected" },
    { name: "Gaming", image: gamingCat, href: "/gaming", description: "Consoles & Controllers" },
    { name: "Audio", image: audioCat, href: "/shop?category=Audio", description: "Immersive Sound" },
    { name: "Accessories", image: accessoriesCat, href: "/shop?category=Accessories", description: "Bundles & Gear" },
    { name: "Electronics", image: electronicsCat, href: "/shop?category=Electronics", description: "Premium Tech" },
  ];

  return (
    <section className="imigongo-pattern imigongo-zigzag py-4 sm:py-8 bg-gradient-to-b from-transparent to-muted/10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8">Popular Categories</h2>
        <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-6 lg:gap-8">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <div className="flex flex-col items-center justify-center gap-1 sm:gap-4 text-center cursor-pointer group p-1.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-primary/10">
                <div className="relative w-14 h-14 sm:w-32 sm:h-32 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain z-10 drop-shadow-md group-hover:drop-shadow-xl" 
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-cyan-100/30 flex items-center justify-center group-hover:bg-cyan-100/50 transition-colors">
                      {(cat as any).icon && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 text-primary/70">
                          {(cat as any).icon}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <span className="block font-bold text-[10px] sm:text-sm tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</span>
                  <span className="hidden sm:block text-[10px] font-medium text-muted-foreground/80 line-clamp-1">{cat.description}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
const CustomerFavorites = () => {
  const { data: smartphones } = useProducts({ category: "Smartphones" });
  const { data: laptops } = useProducts({ category: "Laptops" });
  const { data: tablets } = useProducts({ category: "Tablets" });
  const { data: audio } = useProducts({ category: "Audio" });
  const { data: home } = useProducts({ category: "Home" });

  const categories = [
    { label: "Smartphones", products: smartphones },
    { label: "Laptops", products: laptops },
    { label: "Tablets", products: tablets },
    { label: "Audio", products: audio },
    { label: "Home", products: home },
  ];

  return (
    <>
      {categories.map((category) => {
        if (!category.products || category.products.length === 0) return null;
        
        return (
          <section key={category.label} className="py-5 sm:py-8 border-b">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-2xl font-bold">Customer Favorites {category.label}</h2>
                <Link href={`/shop?category=${category.label}`}>
                  <Button variant="ghost" className="text-primary font-bold">
                    See all <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <Carousel className="w-full">
                <CarouselContent className="-ml-4">
                  {category.products.slice(0, 8).map((product) => (
                    <CarouselItem key={product.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                </div>
              </Carousel>
            </div>
          </section>
        );
      })}
    </>
  );
};
const TopDeals = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: hotDeals } = useQuery<any[]>({
    queryKey: ["/api/products/hot-deals"],
    queryFn: async () => {
      const res = await fetch("/api/products/hot-deals");
      return res.ok ? res.json() : [];
    },
  });

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    return { hours: Math.floor(diff / 3600), minutes: Math.floor((diff % 3600) / 60), seconds: diff % 60 };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const products = (hotDeals || []).filter((p: any) => p.isHotDeal && p.hotDealDiscount && p.hotDealDiscount > 0);
  if (products.length === 0) return null;
  const maxDiscount = Math.max(...products.map((product: any) => getProductPricing(product).discount));

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="w-full py-5 px-3 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Today's Top Deals</h2>
          <Link href="/deals" className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* ── MOBILE: stacked (timer on top, products below) ── */}
        <div className="flex flex-col gap-3 sm:hidden">

          {/* Mobile timer banner — full width, with product images peeking right */}
          <div
            className="relative rounded-2xl overflow-hidden flex items-stretch"
            style={{
              minHeight: 130,
              background: "radial-gradient(ellipse at 25% 50%, #2a2200 0%, #111111 60%, #0a0a0a 100%)",
            }}
          >
            {/* Glow */}
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 h-28 w-28 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(245,206,51,0.18) 0%, transparent 70%)" }} />

            {/* Left: label + timer + button */}
            <div className="relative z-10 flex flex-col justify-center gap-1.5 px-4 py-4 flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#F5CE33" }}>SAVE UP TO {maxDiscount}%</p>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Today Deals</p>
              <div className="font-black text-white tabular-nums text-3xl tracking-widest leading-none">
                {pad(timeLeft.hours)}<span style={{ color: "#F5CE33" }} className="mx-1">:</span>{pad(timeLeft.minutes)}<span style={{ color: "#F5CE33" }} className="mx-1">:</span>{pad(timeLeft.seconds)}
              </div>
              <Link href="/deals" className="mt-1">
                <button
                  className="font-black text-[11px] px-5 py-2 rounded-xl transition-all active:scale-95 shadow-lg whitespace-nowrap"
                  style={{ background: "#F5CE33", color: "#111111" }}
                >
                  Shop all Deals
                </button>
              </Link>
            </div>

          </div>

          {/* Mobile product carousel */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide py-1 select-none"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
          >
            {products.slice(0, 12).map((product: any) => (
              <div
                key={product.id}
                className="shrink-0 relative"
                style={{ width: 148, minWidth: 148 }}
              >
                <div className="absolute top-2 left-2 z-10">
                  <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                    🔥 Flash Sale
                  </span>
                </div>
                <ProductCard product={product} hideFeaturedBadge />
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: side-by-side (timer left, products right) ── */}
        <div className="hidden sm:flex gap-3 items-stretch">

          {/* Dark timer card */}
          <div
            className="shrink-0 relative rounded-2xl overflow-hidden flex flex-col items-center justify-between"
            style={{
              width: 176,
              minWidth: 176,
              minHeight: 290,
              background: "radial-gradient(ellipse at 50% 35%, #2a2200 0%, #111111 55%, #0a0a0a 100%)",
            }}
          >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(245,206,51,0.13) 0%, transparent 70%)" }} />

            <svg viewBox="0 0 200 90" className="w-full absolute top-0 left-0 z-10" aria-hidden="true">
              <defs><path id="arc-top-td" d="M 18,78 A 88,88 0 0,1 182,78" /></defs>
              <text fill="#F5CE33" fontSize="12.5" fontWeight="900" fontFamily="system-ui,sans-serif" letterSpacing="1.5">
                <textPath href="#arc-top-td" startOffset="50%" textAnchor="middle">SAVE UP TO {maxDiscount}%</textPath>
              </text>
            </svg>

            <div className="relative z-10 flex flex-col items-center justify-center flex-1 pt-10 pb-2 w-full px-3">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Today Deals</p>
              <div className="font-black text-white tabular-nums text-2xl tracking-wider leading-none">
                {pad(timeLeft.hours)}<span style={{ color: "#F5CE33" }} className="mx-0.5">:</span>{pad(timeLeft.minutes)}<span style={{ color: "#F5CE33" }} className="mx-0.5">:</span>{pad(timeLeft.seconds)}
              </div>
              <Link href="/deals" className="w-full mt-5">
                <button
                  className="w-full font-black text-xs py-2.5 rounded-xl transition-all active:scale-95 shadow-lg"
                  style={{ background: "#F5CE33", color: "#111111" }}
                >
                  Shop all Deals
                </button>
              </Link>
            </div>

            <svg viewBox="0 0 200 90" className="w-full absolute bottom-0 left-0 z-10" aria-hidden="true">
              <defs><path id="arc-bot-td" d="M 18,12 A 88,88 0 0,0 182,12" /></defs>
              <text fill="#F5CE33" fontSize="12.5" fontWeight="900" fontFamily="system-ui,sans-serif" letterSpacing="1.5">
                <textPath href="#arc-bot-td" startOffset="50%" textAnchor="middle">DEALS ADDED DAILY</textPath>
              </text>
            </svg>
          </div>

          {/* Desktop product carousel */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => scroll("left")}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              aria-label="Scroll left"
            >
              <ArrowRight className="h-4 w-4 rotate-180 text-gray-700 dark:text-gray-200" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-4 w-4 text-gray-700 dark:text-gray-200" />
            </button>
            <div
              className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-6 select-none"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 88%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 88%, transparent 100%)",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
              }}
            >
              {products.slice(0, 12).map((product: any) => (
                <div
                  key={product.id}
                  className="shrink-0 relative"
                  style={{ width: 164, minWidth: 164 }}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                      🔥 Flash Sale
                    </span>
                  </div>
                  <ProductCard product={product} hideFeaturedBadge />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
const TrustBanner = () => {
  return (
    <section className="imigongo-pattern imigongo-waves py-6 sm:py-10 bg-gradient-to-b from-teal-50/30 to-transparent dark:from-teal-950/10 dark:to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-bold text-teal-900 dark:text-teal-400">Premium Refurbished. Trusted Quality.</h2>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="bg-green-500 p-0.5 rounded-sm">
                <Star className="w-3 h-3 fill-white text-white" />
              </div>
              <span className="font-bold text-teal-900 dark:text-white">Google Reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { title: "Save up to 70%", icon: Star },
              { title: "12 Months Warranty", icon: ShieldCheck },
              { title: "30-Day Returns", icon: RotateCcw },
              { title: "Quality Checked", icon: Star },
              { title: "Save CO₂ vs new", icon: Star }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <p className="font-bold text-teal-900 dark:text-teal-400 text-sm leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
const MaximizeSavings = () => {
  const savingsDeals = [
    { badge: "10% Off", badgeColor: "#00858d", img: "/images/ugreen-adapter.webp", name: "USB-C Hub", worth: "RWF 6,500" },
    { badge: "Free", badgeColor: "#25a244", img: "/images/soundcore-liberty-4.webp", name: "Earbuds Case", worth: "RWF 8,000" },
    { badge: "Flash", badgeColor: "#e53935", img: "/images/iphone-16.webp", name: "iPhone 16", worth: "RWF 1,200,000" },
    { badge: "BOGO", badgeColor: "#FFC107", img: "/images/beats-pill.webp", name: "Beats Pill", worth: "RWF 250,000" },
    { badge: "15% Off", badgeColor: "#00858d", img: "/images/saramonic-mic.webp", name: "Mic System", worth: "RWF 42,000" },
    { badge: "Free", badgeColor: "#25a244", img: "/images/iphone-17-pro-max-1.webp", name: "Screen Guard", worth: "RWF 5,000" },
  ];

  const { data: activeCoupons = [] } = useQuery<CouponCode[]>({
    queryKey: ["/api/coupons"],
    staleTime: 60000,
  });

  const ScrollRow = ({ items }: { items: typeof savingsDeals }) => (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {items.map((item, i) => (
        <Link key={i} href="/shop">
          <div className="flex-shrink-0 w-[100px] h-[130px] rounded-[10px] bg-[#f5f5f5] dark:bg-gray-800 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col">
            <div className="relative flex-1 bg-white dark:bg-gray-700 flex items-center justify-center p-1 min-h-0">
              <span
                className="absolute top-1 left-1 z-10 text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none"
                style={{ backgroundColor: item.badgeColor, color: "#fff" }}
              >
                {item.badge}
              </span>
              <img
                src={item.img}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
                {...getResponsiveImageProps(item.img, "100px")}
              />
            </div>
            <div className="px-1.5 pt-1 pb-1.5 bg-[#f5f5f5] dark:bg-gray-800">
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">{item.name}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">worth {item.worth}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="imigongo-pattern imigongo-diamonds px-3 py-3 space-y-3 max-w-7xl mx-auto">
      {/* Row 1 — Maximize your savings */}
      <div className="bg-white dark:bg-gray-900 rounded-[14px] p-3 md:p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-[14px] md:text-base font-black text-gray-900 dark:text-white">Maximize your savings</h2>
          <Link href="/shop" className="text-[12px] font-semibold text-[#00858d] hover:underline">
            See all →
          </Link>
        </div>
        <ScrollRow items={savingsDeals} />
      </div>

      {/* Row 2 — Top deals for you (with live coupon codes from admin) */}
      {activeCoupons.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-[14px] p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] md:text-base font-black text-gray-900 dark:text-white">Live coupon deals</h2>
            <Link href="/deals" className="text-[12px] font-semibold text-[#00858d] hover:underline">
              See all →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {activeCoupons.map((coupon) => {
              const color = (coupon as any).badgeColor || "#00858d";
              const label = coupon.discountType === "percentage"
                ? `${coupon.discountValue}% off`
                : `RWF ${coupon.discountValue.toLocaleString()} off`;
              return (
                <div
                  key={coupon.id}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ border: `1.5px dashed ${color}`, backgroundColor: `${color}12` }}
                  onClick={() => navigator.clipboard?.writeText(coupon.code)}
                  title="Click to copy code"
                >
                  <span className="text-[9px] font-bold" style={{ color }}>{coupon.label || label}</span>
                  <span className="text-[8px] font-black bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-full font-mono" style={{ color, border: `1px solid ${color}40` }}>
                    {coupon.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

const HomeProducts = () => {
  const { data: products } = useProducts({ category: "Home" });
  
  if (!products || products.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="imigongo-pattern imigongo-rings py-5 sm:py-8"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold">Home Products</h2>
          <Link href="/home-kitchen">
            <Button variant="ghost" className="text-primary font-bold">
              See all <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {products.slice(0, 8).map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
          </div>
        </Carousel>
      </div>
    </motion.section>
  );
};
const GamingPreview = () => {
  const { data: products } = useProducts({ category: "Gaming" });
  
  if (!products || products.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-5 sm:py-8"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold">Gaming Gear</h2>
          <Link href="/gaming">
            <Button variant="ghost" className="text-primary font-bold">
              See all <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {products.slice(0, 6).map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
          </div>
        </Carousel>
      </div>
    </motion.section>
  );
};
export const CircularEconomy = () => {
  const { data: dbVideos, isLoading } = useQuery<any[]>({
    queryKey: ["/api/videos"]
  });

  const activeDbVideos = dbVideos?.filter(v => v.isActive) || [];
  const featuredVideos = activeDbVideos.filter(v => v.isFeatured);
  const sortedVideos = [
    ...featuredVideos,
    ...activeDbVideos.filter(v => !v.isFeatured),
  ];

  const defaultVideos = [
    { id: -1, url: "/videos/economy.mp4", title: null, description: null },
    { id: -2, url: "/videos/iphone17.mp4", title: null, description: null },
  ];

  const displayVideos = sortedVideos.length > 0 ? sortedVideos : defaultVideos;

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const activeVideo = displayVideos[activeIdx] || displayVideos[0];

  const pauseAll = () => {
    mobileVideoRef.current?.pause();
    videoRefs.current.forEach(r => r?.pause());
  };

  const playActive = (idx: number) => {
    // Only play one layout at a time to prevent audio echo
    if (window.matchMedia("(min-width: 768px)").matches) {
      mobileVideoRef.current?.pause();
      videoRefs.current[idx]?.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRefs.current.forEach(r => r?.pause());
      mobileVideoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playActive(activeIdx);
        } else {
          pauseAll();
          setIsPlaying(false);
        }
      });
    }, { threshold: 0.2 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { if (sectionRef.current) observer.unobserve(sectionRef.current); };
  }, [activeIdx, displayVideos]);

  const switchTo = (idx: number) => {
    pauseAll();
    setActiveIdx(idx);
    // play after state update on next tick
    setTimeout(() => playActive(idx), 0);
  };

  const handleEnded = (idx: number) => {
    const next = (idx + 1) % displayVideos.length;
    switchTo(next);
  };

  // Keep a ref to the latest activeIdx & length so swipe handler is never stale
  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;
  const videosLenRef = useRef(displayVideos.length);
  videosLenRef.current = displayVideos.length;
  const switchToRef = useRef(switchTo);
  switchToRef.current = switchTo;

  const videoCarouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = videoCarouselRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 10) e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const delta = startX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) {
        const len = videosLenRef.current;
        const cur = activeIdxRef.current;
        if (delta > 0) switchToRef.current((cur + 1) % len);
        else switchToRef.current((cur - 1 + len) % len);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, []); // runs once — handlers always read fresh values via refs

  if (isLoading) return null;

  const glowColors = [
    "from-[#00858d] to-[#F5CE33]",
    "from-[#F5CE33] to-[#00858d]",
    "from-[#00858d] to-cyan-400",
    "from-[#F5CE33] to-orange-400",
  ];

  return (
    <section ref={sectionRef} className="imigongo-pattern imigongo-checker w-full py-4 px-3 md:px-6 lg:px-8" data-testid="promo-videos-section">
      <div
        ref={videoCarouselRef}
        className="relative w-full overflow-hidden rounded-3xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-gradient-to-br dark:from-[#070d1f] dark:via-[#0a1020] dark:to-[#050a18] dark:text-white dark:ring-white/10"
      >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-[100px] pointer-events-none dark:bg-[#00858d]/15" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-yellow-400/10 blur-[80px] pointer-events-none dark:bg-[#F5CE33]/8" />
      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none dark:bg-[radial-gradient(circle,rgba(255,255,255,0.025)_1px,transparent_1px)]" />

      {/* ── MOBILE layout: video fills top of card, info below ── */}
      <div className="relative z-10 flex flex-col md:hidden">
        {/* Active video — full width at top. key=activeIdx forces remount on switch */}
        <div className="relative w-full overflow-hidden" style={{ height: "clamp(380px, 72vh, 560px)" }}>
          <video
            key={activeVideo?.id ?? activeIdx}
            ref={mobileVideoRef}
            src={activeVideo?.url}
            preload="none"
            muted={isMuted}
            playsInline
            loop={displayVideos.length === 1}
            onEnded={() => handleEnded(activeIdx)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1f] via-transparent to-black/15 pointer-events-none" />
          {/* LIVE badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          </div>
          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-3 right-3 rounded-full bg-black/50 border border-white/20 p-2 backdrop-blur-sm"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-white/60" /> : <Volume2 className="h-3.5 w-3.5 text-[#F5CE33]" />}
          </button>
          {/* Nav arrows */}
          {displayVideos.length > 1 && (
            <>
              <button
                onClick={() => switchTo((activeIdx - 1 + displayVideos.length) % displayVideos.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 border border-white/20 p-1.5 backdrop-blur-sm"
              >
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => switchTo((activeIdx + 1) % displayVideos.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 border border-white/20 p-1.5 backdrop-blur-sm"
              >
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Info + CTAs below video */}
        <div className="px-5 pt-5 pb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00858d]/30 bg-[#00858d]/10 px-3 py-1 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5CE33] animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] dark:text-[#F5CE33]">Promo Spotlight</span>
          </div>
          <h2 className="mb-1 text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Drop-Worthy</h2>
          <div className="mb-3 inline-block rounded-xl border border-primary/15 bg-primary/5 px-4 py-1 text-2xl font-black tracking-tight text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white">
            Deals & Promos
          </div>
          {activeVideo?.title ? (
            <p className="mb-4 line-clamp-2 text-sm font-bold text-slate-700 dark:text-white/80">{activeVideo.title}</p>
          ) : (
            <p className="mb-4 text-sm text-slate-500 dark:text-white/50">Exclusive offers, flash sales, and new drops every week.</p>
          )}
          {displayVideos.length > 1 && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {displayVideos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchTo(i)}
                  data-testid={`promo-dot-${i}`}
                  aria-label={`Show video ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${i === activeIdx ? "h-2 w-6 bg-primary dark:bg-[#F5CE33]" : "h-2 w-2 bg-slate-300 dark:bg-white/20"}`}
                />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <Link href="/shop">
              <button data-testid="promo-shop-btn" className="w-full flex items-center justify-center gap-2 bg-[#00858d] text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95">
                <ArrowRight className="h-4 w-4" /> Shop All Deals
              </button>
            </Link>
            <button
              data-testid="promo-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition-all active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-slate-400 dark:text-white/40" /> : <Volume2 className="h-4 w-4 text-primary dark:text-[#F5CE33]" />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP layout: text left, video carousel right ── */}
      <div className="relative z-10 hidden md:flex items-center justify-between px-10 lg:px-14 py-10" style={{ minHeight: 340 }}>
        {/* Left — Copy */}
        <div className="flex-1 max-w-md pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00858d]/30 bg-[#00858d]/10 px-4 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#F5CE33] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F5CE33]" />
            </span>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em] dark:text-[#F5CE33]">Promotion Spotlight</span>
          </div>
          <h2 className="mb-2 text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white lg:text-5xl">Drop-Worthy</h2>
          <div className="mb-5 inline-block rounded-xl border border-primary/15 bg-primary/5 px-4 py-1 text-4xl font-black tracking-tight text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white lg:text-5xl">
            Deals & Promos
          </div>
          {activeVideo?.title ? (
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-slate-700 dark:text-white/70 lg:text-base">{activeVideo.title}</p>
          ) : (
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-white/50 lg:text-base">Exclusive offers, flash sales, and new drops every week.</p>
          )}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { icon: Zap, label: "Flash Deals", color: "text-[#F5CE33]" },
              { icon: Tag, label: "Best Prices", color: "text-[#00858d]" },
              { icon: Sparkles, label: "New Arrivals", color: "text-[#F5CE33]" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                <Icon className={`h-3 w-3 ${color}`} /> {label}
              </div>
            ))}
          </div>
          {displayVideos.length > 1 && (
            <div className="flex items-center gap-2 mb-5">
              {displayVideos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchTo(i)}
                  data-testid={`promo-dot-${i}`}
                  aria-label={`Show video ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${i === activeIdx ? "h-2 w-8 bg-primary dark:bg-[#F5CE33]" : "h-2 w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/40"}`}
                />
              ))}
              <span className="ml-2 text-[10px] font-bold text-slate-500 dark:text-white/50">{activeIdx + 1} / {displayVideos.length}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Link href="/shop">
              <button data-testid="promo-shop-btn" className="flex items-center gap-2 bg-[#00858d] hover:bg-[#006e75] text-white font-black text-sm px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95">
                Shop All Deals <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <button
              data-testid="promo-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition-all hover:scale-105 hover:bg-slate-50 active:scale-95 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-slate-400 dark:text-white/50" /> : <Volume2 className="h-4 w-4 text-primary dark:text-[#F5CE33]" />}
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>

        {/* Right — Video carousel with prev/next arrows */}
        <div className="relative flex items-center gap-3 select-none">
          {displayVideos.length > 1 && (
            <button
              onClick={() => switchTo((activeIdx - 1 + displayVideos.length) % displayVideos.length)}
              className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 rounded-full border border-slate-300 bg-white p-2 text-slate-700 backdrop-blur-sm transition-all hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex gap-3 items-center">
            {displayVideos.slice(0, 4).map((vid, i) => {
              const isActive = i === activeIdx;
              const glow = glowColors[i % glowColors.length];
              return (
                <div
                  key={vid.id ?? i}
                  data-testid={`promo-video-${i}`}
                  onClick={() => switchTo(i)}
                  className={`relative cursor-pointer transition-all duration-500 shrink-0 ${isActive ? "scale-100 z-10" : "scale-[0.88] opacity-40"}`}
                  style={{ width: isActive ? "clamp(140px, 18vw, 190px)" : "clamp(80px, 11vw, 120px)" }}
                >
                  {isActive && (
                    <div className={`absolute -inset-2 bg-gradient-to-b ${glow} rounded-[28px] blur-xl opacity-40 pointer-events-none`} />
                  )}
                  <div className="relative aspect-[9/16] overflow-hidden rounded-[22px] border border-slate-200 bg-black shadow-2xl dark:border-white/10">
                    <video
                      ref={el => { videoRefs.current[i] = el; }}
                      src={vid.url}
                      preload="none"
                      muted={isMuted}
                      playsInline
                      loop={displayVideos.length === 1}
                      onEnded={() => handleEnded(i)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/15" />
                    {!isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/40 border border-white/25 p-2.5 backdrop-blur-sm">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-wider shadow-lg">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                        </span>
                      </div>
                    )}
                    {(vid as any).isFeatured && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400/90 shadow-lg">
                          <Sparkles className="h-2.5 w-2.5 text-yellow-900" />
                        </span>
                      </div>
                    )}
                    {vid.title && (
                      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-5 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-[10px] font-black text-white leading-tight line-clamp-2">{vid.title}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {displayVideos.length > 1 && (
            <button
              onClick={() => switchTo((activeIdx + 1) % displayVideos.length)}
              className="absolute -right-10 top-1/2 -translate-y-1/2 z-10 rounded-full border border-slate-300 bg-white p-2 text-slate-700 backdrop-blur-sm transition-all hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
    </section>
  );
};
const AudioPreview = () => {
  const { data: products } = useProducts({ category: "Audio" });
  
  if (!products || products.length === 0) return null;

  return (
    <section className="imigongo-pattern imigongo-diagonal py-5 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold">Audio</h2>
          <Link href="/audio">
            <Button variant="ghost" className="text-primary font-bold">
              See all <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-4">
            {products.slice(0, 6).map((product) => (
              <CarouselItem key={product.id} className="pl-4 basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
          </div>
        </Carousel>
      </div>
    </section>
  );
};


const FeaturedSlider = () => {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: slides = [] } = useQuery<any[]>({
    queryKey: ["/api/featured-slides"],
    queryFn: async () => {
      const res = await fetch("/api/featured-slides");
      return res.json();
    },
  });

  const fmtPrice = (v: number) =>
    new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);

  const goTo = (idx: number) => {
    if (isAnimating || idx === current) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 300);
  };

  const goNext = () => goTo((current + 1) % slides.length);
  const goPrev = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setTimeout(goNext, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slides.length]);

  if (!slides.length) return null;

  const slide = slides[current];

  return (
    <section className="w-full py-4 px-3 md:px-6 lg:px-8">
      <div
        className="relative w-full rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F5CE33 0%, #E8B800 40%, #F5CE33 70%, #FFD700 100%)" }}
      >
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #000 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />

        {/* ── MOBILE layout (stacked: image top, text bottom) ── */}
        <div
          className="relative z-10 flex flex-col md:hidden"
          style={{ opacity: isAnimating ? 0 : 1, transition: "opacity 0.3s ease" }}
        >
          {/* Image area with rings behind */}
          <div className="relative flex items-center justify-center pt-10 pb-2 px-8" style={{ minHeight: 220 }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-52 w-52 rounded-full border-[28px] border-white/15 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full border-[20px] border-white/10 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                loading="lazy"
                decoding="async"
                className="relative z-10 h-44 w-full object-contain"
                style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.22))" }}
              />
            )}
          </div>

          {/* Text + CTA */}
          <div className="px-6 pb-8 text-center">
            {slide.badge && (
              <span className="inline-block bg-white/90 text-gray-800 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3 shadow-sm">
                {slide.badge}
              </span>
            )}
            <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tight mb-1">
              {slide.titleLine1}
            </h2>
            <div className="inline-block bg-gray-900 text-yellow-300 text-3xl font-black px-4 py-1 rounded-xl mb-4 tracking-tight">
              {slide.titleLine2}
            </div>
            {slide.price && (
              <p className="text-xl font-black text-gray-900 mb-5 tracking-tight">
                {fmtPrice(slide.price)}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Link href={slide.linkUrl || "/shop"} className="w-full">
                <button className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-black text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95">
                  <ArrowRight className="h-4 w-4" />
                  View Product
                </button>
              </Link>
              <Link href="/shop" className="w-full">
                <button className="w-full flex items-center justify-center gap-2 bg-transparent text-gray-900 font-bold text-sm px-6 py-3.5 rounded-2xl border-2 border-gray-900/20 transition-all active:scale-95">
                  Shop All
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout (side by side) ── */}
        <div
          className="relative z-10 hidden md:flex items-center justify-between h-full px-10 lg:px-14 py-10"
          style={{ opacity: isAnimating ? 0 : 1, transition: "opacity 0.3s ease", minHeight: 300 }}
        >
          {/* Decorative rings — desktop */}
          <div className="absolute right-[26%] top-1/2 -translate-y-1/2 h-72 w-72 rounded-full border-[32px] border-white/10 pointer-events-none" />
          <div className="absolute right-[26%] top-1/2 -translate-y-1/2 h-52 w-52 rounded-full border-[24px] border-white/10 pointer-events-none" />
          <div className="absolute right-[26%] top-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-white/10 pointer-events-none" />

          {/* Left — Text */}
          <div className="flex-1 max-w-lg pr-6">
            {slide.badge && (
              <span className="inline-block bg-white/90 backdrop-blur text-gray-800 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 shadow-sm">
                {slide.badge}
              </span>
            )}
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-2">
              {slide.titleLine1}
            </h2>
            <div className="inline-block bg-gray-900 text-yellow-300 text-4xl lg:text-5xl font-black px-4 py-1 rounded-xl mb-5 tracking-tight">
              {slide.titleLine2}
            </div>
            {slide.description && (
              <p className="text-gray-700 text-sm lg:text-base leading-relaxed mb-5 max-w-sm">
                {slide.description}
              </p>
            )}
            {slide.price && (
              <p className="text-2xl lg:text-3xl font-black text-gray-900 mb-6 tracking-tight">
                {fmtPrice(slide.price)}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Link href={slide.linkUrl || "/shop"}>
                <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-gray-900/20 transition-all hover:scale-105 active:scale-95">
                  <ArrowRight className="h-4 w-4" /> View Product
                </button>
              </Link>
              <Link href="/shop">
                <button className="flex items-center gap-2 bg-white/70 hover:bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-2xl border-2 border-gray-900/10 backdrop-blur transition-all hover:scale-105 active:scale-95">
                  Shop All
                </button>
              </Link>
            </div>
          </div>

          {/* Right — Product image */}
          <div className="relative shrink-0 flex items-center justify-center w-60 lg:w-80 h-60 lg:h-72">
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.18))" }}
              />
            )}
          </div>
        </div>

        {/* Prev Arrow */}
        {slides.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 hover:bg-white backdrop-blur shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ArrowRight className="h-4 w-4 text-gray-900 rotate-180" />
          </button>
        )}

        {/* Next Arrow */}
        {slides.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 hover:bg-white backdrop-blur shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <ArrowRight className="h-4 w-4 text-gray-900" />
          </button>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 ${idx === current ? "w-6 h-2.5 bg-gray-900" : "w-2.5 h-2.5 bg-gray-900/30 hover:bg-gray-900/50"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const HomeSectionsDisplay = () => {
  const { data: sections } = useQuery({
    queryKey: ["/api/home-sections"],
    queryFn: async () => {
      const res = await fetch("/api/home-sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
  });

  const { data: allProducts } = useProducts();

  if (!sections) return null;
  if (sections.length === 0) return <FeaturedPosterMarquee />;

  const targetIndices = sections.reduce((indices: number[], section: any, index: number) => {
    const title = String(section.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (title.includes("newarrivals") || title.includes("bestsmartphonesofnovember")) indices.push(index);
    return indices;
  }, []);
  const promoAfterIndex = targetIndices.length > 0 ? Math.max(...targetIndices) : sections.length - 1;

  return (
    <>
      {sections.map((section: any, index: number) => {
        let productsToShow = allProducts || [];

        if (section.type === "specific_products") {
          const productsById = new Map(productsToShow.map((product: any) => [Number(product.id), product]));
          const selectedIds = Array.isArray(section.productIds)
            ? section.productIds.map(Number).filter((id: number) => Number.isFinite(id))
            : [];
          productsToShow = selectedIds
            .map((id: number) => productsById.get(id))
            .filter(Boolean);
        } else {
          if (section.categoryFilter && section.categoryFilter !== "all") {
            productsToShow = productsToShow.filter((p: any) => p.category === section.categoryFilter);
          }
          productsToShow = productsToShow.slice(0, section.limit || 8);
        }

        const sectionContent = productsToShow.length === 0 ? null : (
          <section className="py-5 sm:py-8 border-b">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Carousel className="w-full" opts={{ align: "start", containScroll: "trimSnaps" }}>
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <div className="flex shrink-0 items-center gap-2">
                  {section.type !== "specific_products" && (
                    <Link href={section.categoryFilter ? `/products?category=${encodeURIComponent(section.categoryFilter)}` : "/products"}>
                      <Button variant="ghost" className="text-primary font-bold">
                        See all <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {productsToShow.length > 1 && (
                    <div className="hidden items-center gap-2 sm:flex">
                      <CarouselPrevious aria-label={`Scroll ${section.title} left`} className="static h-8 w-8 translate-y-0 rounded-full border-slate-200 bg-background text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" />
                      <CarouselNext aria-label={`Scroll ${section.title} right`} className="static h-8 w-8 translate-y-0 rounded-full border-slate-200 bg-background text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
                <CarouselContent className="-ml-4">
                  {productsToShow.map((product: any) => (
                    <CarouselItem key={product.id} className="pl-4 basis-[58%] min-[480px]:basis-[40%] md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </section>
        );

        return (
          <Fragment key={section.id}>
            {sectionContent}
            {index === promoAfterIndex && <FeaturedPosterMarquee />}
          </Fragment>
        );
      })}
    </>
  );
};

export default function Home() {
  const { data: featuredProducts, isLoading: featuredLoading } = useProducts({ featured: "true" });
  const { data: dealProducts, isLoading: dealsLoading } = useProducts({ category: "Deals" });
  const { data: gamingProducts } = useProducts({ category: "Gaming" });
  const { data: homeProducts } = useProducts({ category: "Home" });
  const { data: smartphoneProducts } = useProducts({ category: "Smartphones" });
  const { data: laptopProducts } = useProducts({ category: "Laptops" });
  const { data: tabletProducts } = useProducts({ category: "Tablets" });
  const { data: watchProducts } = useProducts({ category: "Smartwatches" });
  const { data: audioProducts } = useProducts({ category: "Audio" });

  const popularCategories = [
    { name: "Smartphones", icon: Smartphone, href: "/shop?category=Smartphones" },
    { name: "Laptops", icon: Laptop, href: "/shop?category=Laptops" },
    { name: "Tablets", icon: Tablet, href: "/shop?category=Tablets" },
    { name: "Smartwatches", icon: Watch, href: "/shop?category=Smartwatches" },
    { name: "Gaming", icon: Gamepad2, href: "/gaming" },
    { name: "Audio", icon: Headphones, href: "/shop?category=Audio" },
    { name: "Accessories & Bundles", icon: Wrench, href: "/shop?category=Accessories" },
    { name: "Electronics", icon: Monitor, href: "/shop?category=Electronics" },
    { name: "Vacuum Cleaners", icon: Trash2, href: "/shop?category=Vacuums" },
    { name: "Home & Kitchen", icon: Tv, href: "/home-kitchen" },
  ];

  const orgSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IFIX",
    "url": "https://ifix.rw",
    "logo": "https://ifix.rw/ifix-logo.png",
    "description": "Premium electronics retailer in Kigali, Rwanda — smartphones, laptops, audio, gaming gear and more.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+250788442127",
      "contactType": "customer service",
      "availableLanguage": ["English", "French", "Kinyarwanda"]
    },
    "sameAs": []
  });

  const websiteSchema = JSON.stringify({
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
  });

  return (
    <>
      <Helmet>
        <title>IFIX – Best Electronics Shop in Kigali, Rwanda</title>
        <meta name="description" content="Shop the latest smartphones, laptops, tablets and certified electronics in Kigali Rwanda. Grade A refurbished devices with 12-month warranty. Trusted since 2019." />
        <meta name="keywords" content="electronics kigali, smartphones rwanda, laptops kigali, iphone kigali, samsung rwanda, iFix, refurbished phones, certified electronics" />
        <meta property="og:title" content="IFIX – Best Electronics Shop in Kigali" />
        <meta property="og:url" content="https://ifix.rw/" />
        <meta name="google-site-verification" content="HZMexTGNu2r654lO4ndFbX2gaHqrhkQv1GjPIFmurPo" />
        <link rel="canonical" href="https://ifix.rw/" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{orgSchema}</script>
        <script type="application/ld+json">{websiteSchema}</script>
      </Helmet>
      <Navbar />
      <WhatsAppFloat />
      <div className="min-h-screen bg-background text-foreground overflow-x-clip">

        <HomeHero />
        <TrustBar />
        <HomeSectionsDisplay />
        <TopDeals />
        <MaximizeSavings />
        <FeaturedSlider />
        <RecommendedProducts />
        <PopularCategories />
        <CustomerFavorites />
        <HomeProducts />
        <GamingPreview />
        <CircularEconomy />
        <AudioPreview />

        <Footer />
      </div>
    </>
  );
}
