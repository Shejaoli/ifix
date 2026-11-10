import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Edit2, GripVertical, Search, X,
  Layers, CheckSquare, Square, Package, Sparkles,
  ChevronDown, ChevronUp, Eye, EyeOff, Save, RotateCcw
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Smartphones", "Audio", "Phones Accessories", "Laptops", "Tablets", "Gaming Consoles", "Smartwatches", "Cameras"];

const SECTION_TYPES = [
  { value: "category_grid", label: "Category Grid", desc: "Show products from a category", icon: "📦" },
  { value: "top_deals", label: "Top Deals", desc: "Auto-show hottest deals", icon: "🔥" },
  { value: "bestsellers", label: "Bestsellers", desc: "Most popular products", icon: "⭐" },
  { value: "new_arrivals", label: "New Arrivals", desc: "Latest additions", icon: "🆕" },
  { value: "lowest_prices", label: "Lowest Prices", desc: "Most affordable items", icon: "💰" },
  { value: "specific_products", label: "Specific Products", desc: "Hand-pick exact products", icon: "🎯" },
];

function ProductPicker({ selectedIds, onChange, allProducts }: {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  allProducts: any[];
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [open, setOpen] = useState(true);

  const filtered = useMemo(() => {
    let list = allProducts || [];
    if (catFilter !== "all") list = list.filter((p: any) => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    return list;
  }, [allProducts, search, catFilter]);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange(Array.from(new Set([...selectedIds, ...filtered.map((p: any) => p.id)])));
  const clearAll = () => onChange([]);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Hand-Pick Products</span>
          {selectedIds.length > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5">
              {selectedIds.length} selected
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-primary/10">
          {/* Controls */}
          <div className="p-3 flex flex-wrap gap-2 border-b border-primary/10 bg-background/50">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <button type="button" onClick={selectAll} className="text-[10px] font-bold text-primary hover:underline px-1">Select all</button>
            <button type="button" onClick={clearAll} className="text-[10px] font-bold text-muted-foreground hover:underline px-1">Clear</button>
          </div>

          {/* Selected badges */}
          {selectedIds.length > 0 && (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const p = allProducts.find((x: any) => x.id === id);
                if (!p) return null;
                return (
                  <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {p.name.slice(0, 20)}{p.name.length > 20 ? "…" : ""}
                    <button type="button" onClick={() => toggle(id)}><X className="h-2.5 w-2.5" /></button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Product list */}
          <div className="max-h-[280px] overflow-y-auto p-3 grid grid-cols-1 gap-1.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No products found</p>
            ) : filtered.map((p: any) => {
              const selected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-2.5 text-left transition-all border",
                    selected
                      ? "bg-primary/10 border-primary/30 text-foreground"
                      : "border-transparent hover:bg-accent/50 text-foreground"
                  )}
                >
                  {selected
                    ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                    : <Square className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  }
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-8 w-8 rounded-md object-contain bg-muted shrink-0"
                    onError={(e: any) => { e.target.style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.brand} · {p.category}</p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(p.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  title: "",
  type: "category_grid",
  isActive: true,
  categoryFilter: "",
  limit: 8,
  order: 0,
  productIds: [] as number[],
};

export default function AdminHomeSections() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);

  const { data: sections = [] } = useQuery({
    queryKey: ["/api/home-sections"],
    queryFn: async () => {
      const res = await fetch("/api/home-sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      return res.json();
    },
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/home-sections", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/home-sections/${editingId}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] }); resetForm(); },
  });

  const reorderMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/home-sections/${data.id}`, { order: data.order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/home-sections/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (section: any) => apiRequest("PATCH", `/api/home-sections/${section.id}`, { isActive: !section.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/home-sections"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.type !== "specific_products") payload.productIds = [];
    if (editingId) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const handleEdit = (section: any) => {
    setEditingId(section.id);
    setFormData({
      title: section.title,
      type: section.type,
      isActive: section.isActive,
      categoryFilter: section.categoryFilter || "",
      limit: section.limit || 8,
      order: section.order || 0,
      productIds: Array.isArray(section.productIds)
        ? section.productIds.map(Number).filter((id: number) => Number.isFinite(id))
        : [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setShowForm(false);
  };

  const handleDrop = (target: any) => {
    if (draggedId && draggedId !== target.id) {
      const dragged = sections.find((s: any) => s.id === draggedId);
      if (dragged) {
        reorderMutation.mutate({ id: draggedId, order: target.order });
        reorderMutation.mutate({ id: target.id, order: dragged.order });
      }
    }
    setDraggedId(null);
  };

  const filtered = filterType === "all" ? sections : sections.filter((s: any) => filterType === "active" ? s.isActive : !s.isActive);
  const typeInfo = (type: string) => SECTION_TYPES.find((t) => t.value === type);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Home Sections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Control what appears on your homepage</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-black">{editingId ? "Edit Section" : "New Section"}</span>
            </div>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title + Active */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Section Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Staff Picks"
                  required
                  className="h-10"
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
                />
                <span className="text-xs font-bold text-muted-foreground">Active</span>
              </div>
            </div>

            {/* Section Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Section Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.value })}
                    className={cn(
                      "flex items-start gap-2 p-3 rounded-xl border text-left transition-all",
                      formData.type === t.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent/30"
                    )}
                  >
                    <span className="text-base leading-none mt-0.5">{t.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Products Picker */}
            {formData.type === "specific_products" ? (
              <ProductPicker
                selectedIds={formData.productIds}
                onChange={(ids) => setFormData({ ...formData, productIds: ids })}
                allProducts={allProducts}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category Filter</label>
                  <Select value={formData.categoryFilter || "all"} onValueChange={(v) => setFormData({ ...formData, categoryFilter: v === "all" ? "" : v })}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Max Products</label>
                  <Input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) || 8 })}
                    min="1" max="24"
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Display Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="h-10"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {editingId ? "Update Section" : "Create Section"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Section List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-black">Active Sections</h2>
            <p className="text-xs text-muted-foreground">Drag to reorder · {sections.length} total</p>
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  filterType === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sections yet. Add one above.</p>
            </div>
          ) : filtered.map((section: any) => {
            const ti = typeInfo(section.type);
            const isDragging = draggedId === section.id;
            return (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedId(section.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(section)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-move group",
                  isDragging ? "opacity-40 scale-95 border-primary/30 bg-primary/5" : "border-border hover:border-border/80 hover:bg-accent/20",
                  !section.isActive && "opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />

                <span className="text-lg shrink-0">{ti?.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">{section.title}</p>
                    {!section.isActive && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ti?.label}
                    {section.type === "specific_products" && section.productIds?.length > 0 && ` · ${section.productIds.length} products`}
                    {section.type !== "specific_products" && section.categoryFilter && section.categoryFilter !== "all" && ` · ${section.categoryFilter}`}
                    {section.type !== "specific_products" && ` · up to ${section.limit || 8}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActiveMutation.mutate(section)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                    title={section.isActive ? "Deactivate" : "Activate"}
                  >
                    {section.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(section.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
