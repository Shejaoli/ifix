import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Wishlist } from "@shared/schema";

type WishlistItem = Wishlist & { product: Product };

interface WishlistContextType {
  wishlist: WishlistItem[];
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

  const { data: wishlist = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!customer,
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      try {
        const res = await fetch("/api/wishlist", { credentials: "include" });
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
  });

  const addMutation = useMutation({
    mutationFn: (productId: number) => apiRequest("POST", "/api/wishlist", { productId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => apiRequest("DELETE", `/api/wishlist/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }),
  });

  const isInWishlist = (productId: number) => wishlist.some(w => w.productId === productId);

  const toggleWishlist = (product: Product) => {
    if (!customer) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your wishlist.",
      });
      setLocation("/login");
      return;
    }
    if (isInWishlist(product.id)) {
      removeMutation.mutate(product.id);
      toast({ title: "Removed from wishlist", description: `${product.name} removed from your wishlist.` });
    } else {
      addMutation.mutate(product.id);
      toast({ title: "Added to wishlist", description: `${product.name} saved to your wishlist.` });
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, isInWishlist, toggleWishlist, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
