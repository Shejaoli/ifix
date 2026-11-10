import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Upload, X, ImageIcon, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { FeaturedSlide } from "@shared/schema";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);

function SlideForm({
  slide,
  onSave,
  onCancel,
  isSaving,
}: {
  slide: Partial<FeaturedSlide> | null;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!slide?.id;
  const [badge, setBadge] = useState(slide?.badge || "NEW ARRIVAL");
  const [titleLine1, setTitleLine1] = useState(slide?.titleLine1 || "");
  const [titleLine2, setTitleLine2] = useState(slide?.titleLine2 || "");
  const [description, setDescription] = useState(slide?.description || "");
  const [price, setPrice] = useState(slide?.price ? String(slide.price) : "");
  const [linkUrl, setLinkUrl] = useState(slide?.linkUrl || "/shop");
  const [isActive, setIsActive] = useState(slide?.isActive ?? true);
  const [order, setOrder] = useState(slide?.order ? String(slide.order) : "0");
  const [imagePreview, setImagePreview] = useState<string | null>(slide?.imageUrl || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("badge", badge);
    fd.append("titleLine1", titleLine1);
    fd.append("titleLine2", titleLine2);
    fd.append("description", description);
    if (price) fd.append("price", price);
    fd.append("linkUrl", linkUrl);
    fd.append("isActive", String(isActive));
    fd.append("order", order);
    if (imageFile) fd.append("image", imageFile);
    onSave(fd);
  };

  const BADGE_PRESETS = ["NEW ARRIVAL", "BEST SELLER", "TRENDING", "HOT DEAL", "LIMITED", "EXCLUSIVE", "SALE"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Badge Label</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {BADGE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBadge(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border transition-all ${badge === p ? "bg-yellow-400 border-yellow-400 text-gray-900" : "border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Custom badge text..."
              className="text-sm"
              data-testid="input-slide-badge"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Title Line 1</label>
              <Input
                value={titleLine1}
                onChange={(e) => setTitleLine1(e.target.value)}
                placeholder="e.g. IPHONE 17"
                required
                className="font-bold"
                data-testid="input-slide-title1"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Title Line 2 (highlighted)</label>
              <Input
                value={titleLine2}
                onChange={(e) => setTitleLine2(e.target.value)}
                placeholder="e.g. PRO MAX"
                required
                className="font-bold"
                data-testid="input-slide-title2"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product description..."
              required
              rows={3}
              data-testid="input-slide-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Price (RWF, optional)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1800000"
                data-testid="input-slide-price"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Display Order</label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                min="0"
                data-testid="input-slide-order"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Link URL</label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/shop or /products/iphone-17-pro"
              data-testid="input-slide-link"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-all ${isActive ? "bg-yellow-400" : "bg-gray-200"}`}
              data-testid="toggle-slide-active"
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : ""}`} />
            </button>
            <span className="text-xs font-bold text-gray-600">{isActive ? "Active (visible on homepage)" : "Inactive (hidden)"}</span>
          </div>
        </div>

        {/* Right: Image */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Product Image (PNG with transparency recommended)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 hover:border-yellow-400 transition-all overflow-hidden bg-gray-50 hover:bg-yellow-50/30"
            style={{ minHeight: 220 }}
          >
            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center p-4" style={{ minHeight: 220 }}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-50 opacity-60 rounded-2xl" />
                <img
                  src={imagePreview}
                  alt="Slide preview"
                  className="relative z-10 max-h-48 object-contain drop-shadow-xl"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 z-20 bg-white rounded-full p-1 shadow hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400 group-hover:text-yellow-500 transition-colors">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 group-hover:bg-yellow-100 flex items-center justify-center transition-colors">
                  <ImageIcon className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Click to upload image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG with transparent bg works best</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-600 border border-yellow-200 group-hover:bg-yellow-400/20 transition-all">
                  <Upload className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Browse Files</span>
                </div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

          {/* Live Preview */}
          {(titleLine1 || titleLine2) && (
            <div className="rounded-xl overflow-hidden border border-yellow-200">
              <div className="text-[9px] font-black uppercase tracking-widest text-yellow-600 bg-yellow-50 px-3 py-1.5 border-b border-yellow-100 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Live Preview
              </div>
              <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-400 to-yellow-500 p-4 flex items-center justify-between overflow-hidden min-h-[100px]">
                <div className="absolute right-4 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="flex-1 pr-4 z-10">
                  {badge && <span className="inline-block bg-white/90 text-gray-900 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2">{badge}</span>}
                  <p className="text-gray-900 font-black text-base leading-tight">{titleLine1}</p>
                  {titleLine2 && <span className="inline-block bg-gray-900 text-yellow-400 font-black text-base px-2 py-0.5 rounded mt-0.5">{titleLine2}</span>}
                  {price && <p className="text-gray-900 font-black text-sm mt-2">{fmt(parseInt(price))}</p>}
                </div>
                {imagePreview && (
                  <div className="relative z-10 h-20 w-20 shrink-0">
                    <img src={imagePreview} alt="" className="h-full w-full object-contain drop-shadow-lg" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <Button type="submit" disabled={isSaving} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black" data-testid="button-save-slide">
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Slide"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-slide">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AdminFeaturedSlides() {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [editSlide, setEditSlide] = useState<FeaturedSlide | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slides = [], isLoading } = useQuery<FeaturedSlide[]>({
    queryKey: ["/api/admin/featured-slides"],
    queryFn: async () => {
      const res = await fetch("/api/admin/featured-slides", { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (fd: FormData) =>
      fetch("/api/admin/featured-slides", { method: "POST", body: fd, credentials: "include" }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-slides"] });
      toast({ title: "Slide created", description: "New featured slide added to the homepage." });
      setView("list");
    },
    onError: (e: any) => toast({ title: "Error", description: e?.error || "Failed to create slide.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) =>
      fetch(`/api/admin/featured-slides/${id}`, { method: "PATCH", body: fd, credentials: "include" }).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-slides"] });
      toast({ title: "Slide updated", description: "Changes saved successfully." });
      setView("list");
      setEditSlide(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e?.error || "Failed to update slide.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/featured-slides/${id}`, { method: "DELETE", credentials: "include" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-slides"] });
      toast({ title: "Slide deleted", description: "The slide has been removed." });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => {
      const fd = new FormData();
      fd.append("isActive", String(!isActive));
      return fetch(`/api/admin/featured-slides/${id}`, { method: "PATCH", body: fd, credentials: "include" }).then((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-slides"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, newOrder }: { id: number; newOrder: number }) => {
      const fd = new FormData();
      fd.append("order", String(newOrder));
      return fetch(`/api/admin/featured-slides/${id}`, { method: "PATCH", body: fd, credentials: "include" }).then((r) => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-slides"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-slides"] });
    },
  });

  const handleMoveUp = (slide: FeaturedSlide, idx: number) => {
    if (idx === 0) return;
    const prev = slides[idx - 1];
    reorderMutation.mutate({ id: slide.id, newOrder: prev.order });
    reorderMutation.mutate({ id: prev.id, newOrder: slide.order });
  };

  const handleMoveDown = (slide: FeaturedSlide, idx: number) => {
    if (idx === slides.length - 1) return;
    const next = slides[idx + 1];
    reorderMutation.mutate({ id: slide.id, newOrder: next.order });
    reorderMutation.mutate({ id: next.id, newOrder: slide.order });
  };

  if (view === "add") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="text-xs text-gray-400 hover:text-gray-700 font-bold">← Back</button>
          <div>
            <h2 className="text-sm font-black text-gray-900">New Featured Slide</h2>
            <p className="text-[10px] text-gray-400">Add a new promotional slide to the homepage slider</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SlideForm
            slide={null}
            onSave={(fd) => createMutation.mutate(fd)}
            onCancel={() => setView("list")}
            isSaving={createMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (view === "edit" && editSlide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("list"); setEditSlide(null); }} className="text-xs text-gray-400 hover:text-gray-700 font-bold">← Back</button>
          <div>
            <h2 className="text-sm font-black text-gray-900">Edit Slide</h2>
            <p className="text-[10px] text-gray-400">{editSlide.titleLine1} {editSlide.titleLine2}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SlideForm
            slide={editSlide}
            onSave={(fd) => updateMutation.mutate({ id: editSlide.id, fd })}
            onCancel={() => { setView("list"); setEditSlide(null); }}
            isSaving={updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Featured Slides
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Homepage promotional slider — drag to reorder, toggle to show/hide</p>
        </div>
        <Button
          onClick={() => setView("add")}
          size="sm"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xs gap-1.5"
          data-testid="button-add-slide"
        >
          <Plus className="h-3.5 w-3.5" /> Add Slide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Slides", value: slides.length, color: "text-gray-900" },
          { label: "Active", value: slides.filter((s) => s.isActive).length, color: "text-yellow-600" },
          { label: "Hidden", value: slides.filter((s) => !s.isActive).length, color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Slides List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <h3 className="text-sm font-black text-gray-700 mb-1">No slides yet</h3>
          <p className="text-xs text-gray-400 mb-4">Create your first featured slide to power the homepage hero slider.</p>
          <Button onClick={() => setView("add")} size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Slide
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`group relative rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${slide.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}
              data-testid={`card-slide-${slide.id}`}
            >
              <div className="flex items-stretch">
                {/* Color strip + order controls */}
                <div className="w-12 shrink-0 bg-gradient-to-b from-yellow-400 to-yellow-500 flex flex-col items-center justify-between py-3 gap-1">
                  <button
                    onClick={() => handleMoveUp(slide, idx)}
                    disabled={idx === 0}
                    className="text-white/60 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center gap-0.5">
                    <GripVertical className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[9px] font-black text-white/70">#{idx + 1}</span>
                  </div>
                  <button
                    onClick={() => handleMoveDown(slide, idx)}
                    disabled={idx === slides.length - 1}
                    className="text-white/60 hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Image thumbnail */}
                <div className="relative w-32 shrink-0 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center border-r border-gray-100">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.titleLine1}
                      className="h-24 w-full object-contain p-2 drop-shadow-md"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-yellow-200 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-block bg-yellow-400 text-gray-900 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                        {slide.badge}
                      </span>
                      {!slide.isActive && (
                        <span className="inline-block bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-gray-900 text-sm leading-tight">
                      {slide.titleLine1}{" "}
                      <span className="bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded text-sm">{slide.titleLine2}</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{slide.description}</p>
                    {slide.price && (
                      <p className="text-xs font-black text-gray-700 mt-1">{fmt(slide.price)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-300 mt-2">
                    <span>→ {slide.linkUrl}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center justify-center gap-2 px-4 border-l border-gray-100">
                  <button
                    onClick={() => toggleMutation.mutate({ id: slide.id, isActive: slide.isActive })}
                    title={slide.isActive ? "Hide slide" : "Show slide"}
                    className={`p-2 rounded-lg transition-all ${slide.isActive ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100" : "text-gray-300 bg-gray-50 hover:bg-gray-100 hover:text-gray-500"}`}
                    data-testid={`button-toggle-slide-${slide.id}`}
                  >
                    {slide.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { setEditSlide(slide); setView("edit"); }}
                    className="p-2 rounded-lg text-teal-500 bg-teal-50 hover:bg-teal-100 transition-all"
                    data-testid={`button-edit-slide-${slide.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${slide.titleLine1} ${slide.titleLine2}"?`)) {
                        deleteMutation.mutate(slide.id);
                      }
                    }}
                    className="p-2 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 transition-all"
                    data-testid={`button-delete-slide-${slide.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
