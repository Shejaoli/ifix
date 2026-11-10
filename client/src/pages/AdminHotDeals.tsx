import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { Flame, Search, Tag, TrendingDown, CheckCircle2, XCircle, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);
}

interface RowEditState {
  isHotDeal: boolean;
  discount: number;
}

export default function AdminHotDeals() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editState, setEditState] = useState<RowEditState>({ isHotDeal: false, discount: 0 });

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/all-products"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, isHotDeal, hotDealDiscount }: { id: number; isHotDeal: boolean; hotDealDiscount: number }) => {
      const res = await fetch(`/api/admin/products/${id}/hot-deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isHotDeal, hotDealDiscount }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/hot-deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hot-deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditRow(null);
      toast({ title: "Hot deal updated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update hot deal" });
    },
  });

  const filtered = (allProducts || []).filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" && p.isHotDeal) || (filter === "inactive" && !p.isHotDeal);
    return matchSearch && matchFilter;
  });

  const hotDealCount = (allProducts || []).filter(p => p.isHotDeal).length;
  const totalSavingsShown = (allProducts || [])
    .filter(p => p.isHotDeal && p.hotDealDiscount)
    .reduce((acc, p) => acc + Math.round(p.price * (p.hotDealDiscount || 0) / 100), 0);

  function startEdit(p: Product) {
    setEditRow(p.id);
    setEditState({ isHotDeal: p.isHotDeal || false, discount: p.hotDealDiscount || 0 });
  }

  function saveEdit(id: number) {
    updateMutation.mutate({ id, isHotDeal: editState.isHotDeal, hotDealDiscount: editState.discount });
  }

  function quickToggle(p: Product) {
    updateMutation.mutate({ id: p.id, isHotDeal: !p.isHotDeal, hotDealDiscount: p.hotDealDiscount || 0 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Today's Top Deals — Homepage Section
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose which products appear in the <span className="font-bold text-orange-500">"Today's Top Deals"</span> section on the homepage</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="rounded-xl border bg-orange-50 border-orange-200 px-4 py-2 text-center">
            <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Active Deals</p>
            <p className="text-2xl font-black text-orange-600">{hotDealCount}</p>
          </div>
          <div className="rounded-xl border bg-green-50 border-green-200 px-4 py-2 text-center">
            <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">Total Savings</p>
            <p className="text-lg font-black text-green-600">{formatCurrency(totalSavingsShown)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-hot-deals-search"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
          {(["all", "active", "inactive"] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              onClick={() => setFilter(f)}
              className="text-xs font-bold capitalize h-8 px-3"
              data-testid={`button-filter-${f}`}
            >
              {f === "active" ? <><Flame className="w-3 h-3 mr-1 text-orange-400" /> Active</> : f === "inactive" ? <><XCircle className="w-3 h-3 mr-1" /> Inactive</> : "All"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <Tag className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm font-medium">No products found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Price</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Discount %</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Deal Price</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const isEditing = editRow === product.id;
                  const discount = isEditing ? editState.discount : (product.hotDealDiscount || 0);
                  const dealPrice = discount > 0 ? Math.round(product.price * (1 - discount / 100)) : product.price;
                  const isActive = isEditing ? editState.isHotDeal : (product.isHotDeal || false);

                  return (
                    <tr key={product.id} className={`border-b last:border-0 transition-colors ${i % 2 === 0 ? "bg-background" : "bg-muted/10"} ${isActive ? "bg-orange-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl?.startsWith("http") ? product.imageUrl : (import.meta.env.VITE_API_URL || "") + product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs leading-tight truncate max-w-[180px]" data-testid={`text-product-name-${product.id}`}>{product.name}</p>
                            <p className="text-[10px] text-muted-foreground">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">{product.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-xs tabular-nums">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={90}
                              value={editState.discount}
                              onChange={(e) => setEditState(s => ({ ...s, discount: Math.min(90, Math.max(0, parseInt(e.target.value) || 0)) }))}
                              className="w-16 h-7 text-center text-xs font-bold"
                              data-testid={`input-discount-${product.id}`}
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <span className={`font-black text-sm ${discount > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
                            {discount > 0 ? `-${discount}%` : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs">
                        {discount > 0 ? (
                          <div>
                            <p className="font-black text-green-600">{formatCurrency(dealPrice)}</p>
                            <p className="text-[10px] text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-medium">{formatCurrency(product.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={editState.isHotDeal}
                              onCheckedChange={(v) => setEditState(s => ({ ...s, isHotDeal: v }))}
                              data-testid={`switch-hot-deal-${product.id}`}
                            />
                            <span className={`text-[10px] font-bold ${editState.isHotDeal ? "text-orange-500" : "text-muted-foreground"}`}>
                              {editState.isHotDeal ? "Active" : "Off"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => quickToggle(product)}
                            disabled={updateMutation.isPending}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all border ${
                              product.isHotDeal
                                ? "bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                            }`}
                            data-testid={`button-toggle-deal-${product.id}`}
                          >
                            {product.isHotDeal ? <><Flame className="w-3 h-3" />Hot Deal</> : <><XCircle className="w-3 h-3" />Inactive</>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => saveEdit(product.id)}
                              disabled={updateMutation.isPending}
                              data-testid={`button-save-${product.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditRow(null)}
                              data-testid={`button-cancel-${product.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => startEdit(product)}
                            data-testid={`button-edit-deal-${product.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 space-y-1">
        <div className="flex items-center gap-2 text-orange-700 font-black text-sm">
          <TrendingDown className="w-4 h-4" />
          How Today's Top Deals work
        </div>
        <ul className="text-xs text-orange-700/80 space-y-1 ml-6 list-disc">
          <li>Toggle any product as a Hot Deal — it immediately appears in the <strong>"Today's Top Deals"</strong> section on the homepage</li>
          <li>If no products are marked as Hot Deals, the section falls back to showing featured products</li>
          <li>Set a discount percentage (0–90%) to show the deal price to customers</li>
          <li>Click the pencil icon to edit both the toggle and discount at once, then save</li>
          <li>Clicking the status badge directly gives a quick on/off toggle (keeps existing discount)</li>
        </ul>
      </div>
    </div>
  );
}
