import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, Flame, User, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

interface CartItem {
  productId: number;
  quantity: number;
}

export function MobileBottomNav() {
  const [location] = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, [location]);

  const items = [
    { name: "Home", icon: Home, href: "/", match: (p: string) => p === "/" },
    { name: "Categories", icon: LayoutGrid, href: "/shop", match: (p: string) => p === "/shop" || p === "/products" },
    { name: "Deals", icon: Flame, href: "/deals", match: (p: string) => p === "/deals", highlight: true },
    { name: "My Orders", icon: User, href: "/orders/lookup", match: (p: string) => p.startsWith("/orders") || p === "/my-orders" || p === "/track-order" },
    { name: "Cart", icon: ShoppingBag, href: "/cart", match: (p: string) => p === "/cart", badge: cartCount },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="nav-mobile-bottom"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(location);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className="relative flex flex-col items-center justify-center gap-1 h-full active:scale-95 transition-transform cursor-pointer"
                data-testid={`link-bottomnav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="relative">
                  <Icon
                    className={`h-[22px] w-[22px] transition-colors ${
                      active
                        ? "text-primary"
                        : item.highlight
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active ? "currentColor" : "none"}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                      data-testid="badge-cart-count"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] leading-none font-medium transition-colors ${
                    active
                      ? "text-primary font-bold"
                      : item.highlight
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
