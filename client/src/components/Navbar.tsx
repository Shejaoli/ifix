import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Menu, X, HelpCircle, Info, User, ChevronRight, Flame, Smartphone, Laptop, Tablet, Watch, Gamepad2, Wrench, Home as HomeIcon, Smartphone as ElectronicsIcon, Layers, Heart, LogOut, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { CartDrawer } from "./CartDrawer";
import { Button } from "./ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/contexts/WishlistContext";
import { NavbarSearch } from "./NavbarSearch";
import { DeliveryLocationPicker } from "./DeliveryLocationPicker";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const isProductPage = location.startsWith("/product/");
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Secret admin access: triple-click logo within 600ms
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<NodeJS.Timeout | null>(null);
  const handleLogoClick = (e: React.MouseEvent) => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 600);
    if (logoClickCount.current >= 3) {
      e.preventDefault();
      logoClickCount.current = 0;
      setLocation("/xifix-portal");
    }
  };

  const { data: customer } = useQuery<{ id: number; fullName: string; email: string } | null>({
    queryKey: ["/api/customer/me"],
    retry: false,
    staleTime: 60000,
    queryFn: async () => {
      try {
        const res = await fetch("/api/customer/me", { credentials: "include" });
        if (!res.ok) return null;
        return res.json();
      } catch { return null; }
    },
  });

  const { wishlist } = useWishlist();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/customer/logout", {}),
    onSuccess: () => {
      queryClient.setQueryData(["/api/customer/me"], null);
      toast({ title: "Signed out", description: "See you next time!" });
    },
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => location === path || location.startsWith(`${path}?`);

  // Handle ESC key to close menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Slide-out overlay + menu — rendered at root level so fixed positioning works correctly */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[101] w-full max-w-xs bg-background shadow-2xl flex flex-col"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-28 object-contain" />
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Section 1: Promo */}
                <div className="rounded-2xl bg-primary/5 p-3 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Flame className="h-4 w-4" />
                    <span className="font-bold text-sm">Hot Deals</span>
                  </div>
                  <Link href="/deals" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-between group text-sm h-9">
                      Browse Deals
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>

                {/* Section 2: Trending */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Trending</h3>
                  <div className="space-y-0.5">
                    {[
                      { name: "iPhones", icon: Smartphone, href: "/iphones" },
                      { name: "Samsung Phones", icon: Smartphone, href: "/shop?search=samsung&category=Smartphones" },
                      { name: "Smartphones", icon: Smartphone, href: "/shop?category=Smartphones" },
                      { name: "Laptops", icon: Laptop, href: "/laptops" },
                      { name: "Tablets", icon: Tablet, href: "/shop?category=Tablets" },
                      { name: "Smartwatches", icon: Watch, href: "/shop?category=Smartwatches" },
                    ].map((item) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Section 3: Shop by Department */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Shop by Department</h3>
                  <div className="space-y-0.5">
                    {[
                      { name: "Electronics", icon: ElectronicsIcon, href: "/electronics" },
                      { name: "Home & Kitchen", icon: HomeIcon, href: "/home-kitchen" },
                      { name: "Gaming", icon: Gamepad2, href: "/gaming" },
                      { name: "Tools", icon: Wrench, href: "/tools-home-improvement" },
                      { name: "All Products", icon: Layers, href: "/shop" },
                    ].map((item) => (
                      <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
                        <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Section 4: Help & Settings */}
                <div className="pt-3 border-t">
                  <div className="space-y-0.5">
                    <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Help</span>
                      </div>
                    </Link>
                    <Link href="/order-history" onClick={() => setIsMenuOpen(false)}>
                      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Order History</span>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between px-2 py-2 rounded-lg">
                      <span className="font-medium text-sm">Appearance</span>
                      <ThemeToggle />
                    </div>
                    {customer ? (
                      <button
                        onClick={() => { logoutMutation.mutate(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Sign Out ({customer.fullName.split(" ")[0]})</span>
                      </button>
                    ) : (
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">Sign In</span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out backdrop-blur-[28px] saturate-180 ${
        scrolled
          ? "bg-white/80 dark:bg-background/80 shadow-[inset_0_-1px_0_rgba(255,255,255,0.28),inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.14)] border-b border-white/20 dark:border-white/12"
          : "bg-white/55 dark:bg-background/55 shadow-[inset_0_-1px_0_rgba(255,255,255,0.18)] border-b border-white/14 dark:border-white/8"
      }`}
    >

      <nav aria-label="Main navigation" className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        {/* Desktop: logo, product search, the four key shopping actions, and the category menu. */}
        <div className="hidden h-16 items-center gap-2 xl:flex">
          <Link href="/" onClick={handleLogoClick} aria-label="IFIX home" className="mr-1 flex shrink-0 items-center gap-2 rounded-xl py-1 transition hover:bg-accent/60">
            <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-20 object-contain" />
          </Link>

          <DeliveryLocationPicker />

          <div className="flex min-w-[180px] flex-1 justify-center px-2">
            <NavbarSearch />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link href={customer ? "/my-orders" : "/login"} title={customer ? `Account: ${customer.fullName}` : "Log in"} className={`inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition hover:bg-accent/70 hover:text-primary ${location === "/login" ? "text-primary" : "text-foreground"}`}>
              <User className="h-5 w-5" />
              <span>{customer ? customer.fullName.split(" ")[0] : "Log in"}</span>
            </Link>
            <Link href="/order-history" title="Orders" className={`inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition hover:bg-accent/70 hover:text-primary ${isActive("/order-history") ? "text-primary" : "text-foreground"}`}>
              <Package className="h-5 w-5" /><span>Orders</span>
            </Link>
            <Link href="/wishlist" title="Wishlist" className={`relative inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition hover:bg-accent/70 hover:text-primary ${isActive("/wishlist") ? "text-primary" : "text-foreground"}`}>
              <Heart className="h-5 w-5" /><span>Wishlist</span>
              {customer && wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{wishlist.length}</span>}
            </Link>
            <CartDrawer />
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition hover:bg-accent/70 hover:text-primary"
              aria-label="Open shop and help menu"
              aria-expanded={isMenuOpen}
              title="Shop categories and more"
            >
              <Menu className="h-6 w-6" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Compact screens keep search prominent and use icon actions to avoid crowding. */}
        <div className="flex flex-col gap-1 py-1.5 xl:hidden">
          <div className="flex min-h-9 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground transition hover:bg-accent/70 hover:text-primary"
              data-testid="button-mobile-menu"
              aria-label="Open shop and help menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <Link href="/" onClick={handleLogoClick} aria-label="IFIX home" className={`flex min-w-0 shrink-0 items-center rounded-lg ${isProductPage ? "px-1" : "gap-1"}`}>
              <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-16 object-contain" />
            </Link>
            <div className="ml-auto flex items-center gap-0.5">
              <Link href={customer ? "/my-orders" : "/login"} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground transition hover:bg-accent/70 hover:text-primary" aria-label={customer ? `Account: ${customer.fullName}` : "Log in"} title={customer ? "My account" : "Log in"}>
                <User className="h-5 w-5" />
              </Link>
              <Link href="/order-history" className="hidden h-7 w-7 items-center justify-center rounded-lg text-foreground transition hover:bg-accent/70 hover:text-primary lg:inline-flex" aria-label="Orders" title="Orders">
                <Package className="h-5 w-5" />
              </Link>
              <Link href="/wishlist" className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg text-foreground transition hover:bg-accent/70 hover:text-primary" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
                {customer && wishlist.length > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{wishlist.length}</span>}
              </Link>
              <div className="[&_button]:h-7 [&_button]:w-7 [&_button]:justify-center [&_button]:px-0"><CartDrawer /></div>
            </div>
          </div>
          {!isProductPage && (
            <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
              <DeliveryLocationPicker compact />
              <div className="min-w-0 flex-1"><NavbarSearch mobile /></div>
            </div>
          )}
        </div>
      </nav>
    </header>
    </>
  );
}
