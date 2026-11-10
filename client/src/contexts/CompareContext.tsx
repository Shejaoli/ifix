import { createContext, useContext, useState, useCallback } from "react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { toast } = useToast();

  const addToCompare = useCallback((product: Product) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 3) {
        toast({
          title: "Compare limit reached",
          description: "You can compare up to 3 products at a time. Remove one to add another.",
          variant: "destructive",
        });
        return prev;
      }
      toast({
        title: "Added to compare",
        description: `${product.name} added to comparison.`,
      });
      return [...prev, product];
    });
  }, [toast]);

  const removeFromCompare = useCallback((productId: number) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    setIsCompareOpen(false);
  }, []);

  const isInCompare = useCallback((productId: number) => {
    return compareList.some(p => p.id === productId);
  }, [compareList]);

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      isCompareOpen,
      setIsCompareOpen,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
