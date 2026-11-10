import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, Home, ShoppingBag, Flame, Gamepad2, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickLinks = [
    { name: "Homepage", href: "/", icon: Home },
    { name: "Shop All", href: "/shop", icon: ShoppingBag },
    { name: "Hot Deals", href: "/deals", icon: Flame },
    { name: "Gaming", href: "/gaming", icon: Gamepad2 },
    { name: "Laptops", href: "/laptops", icon: Laptop },
  ];

  return (
    <>
      <Helmet>
        <title>Page Not Found (404) — IFIX</title>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://ifix.rw/" />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          {/* 404 Header */}
          <div className="space-y-3">
            <div className="text-7xl font-bold text-primary">404</div>
            <h1 className="text-3xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-muted-foreground">
              Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Search for products:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="icon" className="rounded-lg">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Quick Navigation */}
          <div className="space-y-3 pt-6 border-t border-border">
            <p className="text-sm font-medium text-foreground">Quick Navigation</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto flex-col py-3 rounded-lg border border-border hover:bg-accent"
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{link.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Additional Help */}
          <div className="space-y-2 pt-4 border-t border-border text-xs text-muted-foreground">
            <p>Need help? Contact us:</p>
            <p>
              <a href="tel:+250788442127" className="text-primary hover:underline">
                +250 788 442 127 (WhatsApp)
              </a>{" "}
              or{" "}
              <a href="mailto:ifixelectronics@gmail.com" className="text-primary hover:underline">
                ifixelectronics@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
