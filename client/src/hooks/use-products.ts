import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useProducts(filters?: { category?: string; featured?: string; search?: string }) {
  // Share one product request across home sections that only differ by
  // category/featured status, then derive those views in memory. Search stays
  // server-filtered so large result sets are not sent to the browser.
  const filterInBrowser = !filters?.search;
  const queryKey = filterInBrowser
    ? [api.products.list.path]
    : [api.products.list.path, filters];

  return useQuery({
    queryKey,
    staleTime: 30_000,
    queryFn: async () => {
      if (filterInBrowser) {
        const res = await fetch(api.products.list.path);
        if (!res.ok) throw new Error("Failed to fetch products");
        return api.products.list.responses[200].parse(await res.json());
      }

      // Create search params from filters
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);

      const url = `${api.products.list.path}?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");

      // Parse with Zod schema from routes
      return api.products.list.responses[200].parse(await res.json());
    },
    select: (products) => {
      if (!filterInBrowser) return products;
      return products.filter((product) => {
        if (filters?.category && product.category !== filters.category) return false;
        if (filters?.featured === "true" && !product.isFeatured) return false;
        return true;
      });
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    staleTime: 30_000,
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");

      return api.products.get.responses[200].parse(await res.json());
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["/api/products/slug", slug],
    staleTime: 30_000,
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`/api/products/slug/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");

      return res.json();
    },
  });
}
