import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery } from "@tanstack/react-query";

export default function Wishlist() {
  const { wishlist, isLoading } = useWishlist();

  const { data: customer } = useQuery<{ id: number } | null>({
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
            <p className="text-muted-foreground mt-2">
              Products you've saved for later
            </p>
          </div>

          {!customer ? (
            <Card className="p-8 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>Sign In to View Your Wishlist</CardTitle>
              <CardDescription className="mt-2">
                Please sign in to see the products you've saved.
              </CardDescription>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse h-64" />
              ))}
            </div>
          ) : wishlist.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>Your Wishlist Is Empty</CardTitle>
              <CardDescription className="mt-2">
                Tap the heart icon on any product to save it here.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {wishlist.map((item) => (
                <ProductCard key={item.id} product={item.product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
