import { formatSiteCurrency } from "@/lib/site-currency";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CouponCode } from "@shared/schema";
import {
  Tag, Plus, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight,
  Copy, Users, TrendingDown, Calendar, Infinity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const fmt = formatSiteCurrency;

const BADGE_COLORS = [
  { label: "Teal", value: "#00858d" },
  { label: "Green", value: "#25a244" },
  { label: "Red", value: "#e53935" },
  { label: "Orange", value: "#FF6D00" },
  { label: "Yellow", value: "#FFC107" },
  { label: "Purple", value: "#6556a5" },
];

interface CouponFormState {
  code: string;
  label: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: string;
  badgeColor: string;
}

const empty: CouponFormState = {
  code: "",
  label: "",
  discountType: "percentage",
  discountValue: 10,
  maxUses: null,
  isActive: true,
  expiresAt: "",
  badgeColor: "#00858d",
};

export default function AdminCoupons() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponFormState>(empty);
  const [copied, setCopied] = useState<number | null>(null);

  const { data: coupons = [], isLoading } = useQuery<CouponCode[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon created" });
      setDialogOpen(false);
      setForm(empty);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon updated" });
      setDialogOpen(false);
      setEditId(null);
      setForm(empty);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/coupons/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Coupon deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/coupons/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (c: CouponCode) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      label: c.label,
      discountType: c.discountType as "percentage" | "fixed",
      discountValue: c.discountValue,
      maxUses: c.maxUses,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
      badgeColor: (c as any).badgeColor || "#00858d",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code || !form.label || form.discountValue <= 0) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    const payload = {
      code: form.code.toUpperCase(),
      label: form.label,
      discountType: form.discountType,
      discountValue: form.discountValue,
      maxUses: form.maxUses,
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const isExpired = (c: CouponCode) =>
    !!c.expiresAt && new Date(c.expiresAt) < new Date();
  const isMaxed = (c: CouponCode) =>
    c.maxUses !== null && c.usedCount >= c.maxUses;
  const isEffectivelyActive = (c: CouponCode) =>
    c.isActive && !isExpired(c) && !isMaxed(c);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" /> Coupon Codes
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Create and manage discount codes shown on the homepage
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5 text-xs font-bold">
          <Plus className="h-3.5 w-3.5" /> New Coupon
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Coupons", value: coupons.length, color: "text-teal-700 bg-teal-50" },
          { label: "Active", value: coupons.filter(isEffectivelyActive).length, color: "text-green-600 bg-green-50" },
          { label: "Total Uses", value: coupons.reduce((s, c) => s + c.usedCount, 0), color: "text-orange-600 bg-orange-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border ${s.color.split(" ")[1]} border-current/10`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-black ${s.color.split(" ")[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Coupon table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(n => <div key={n} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
          <Tag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">No coupon codes yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "New Coupon" to create one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => {
            const active = isEffectivelyActive(c);
            const expired = isExpired(c);
            const maxed = isMaxed(c);
            return (
              <div key={c.id} className={`flex items-center gap-3 rounded-xl border p-3 bg-white transition-all ${active ? "border-gray-200 shadow-sm" : "border-gray-100 opacity-60"}`}>
                {/* Color dot */}
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: (c as any).badgeColor || "#00858d" }} />

                {/* Code + label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyCode(c.id, c.code)}
                      className="font-black text-sm text-gray-900 font-mono tracking-wider hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {c.code}
                      {copied === c.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-gray-300" />}
                    </button>
                    <span className="text-xs text-gray-500">{c.label}</span>
                    {expired && <Badge variant="destructive" className="text-[9px] py-0 px-1.5">Expired</Badge>}
                    {maxed && !expired && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">Limit Reached</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-bold text-primary">
                      {c.discountType === "percentage" ? `-${c.discountValue}%` : `-${fmt(c.discountValue)}`}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Users className="h-3 w-3" />
                      {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ""} uses
                    </span>
                    {c.expiresAt && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    {c.maxUses === null && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Infinity className="h-3 w-3" /> Unlimited
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })}
                    className="scale-75"
                  />
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete coupon "${c.code}"?`)) deleteMutation.mutate(c.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-black">
              <Tag className="h-4 w-4 text-primary" />
              {editId ? "Edit Coupon" : "Create New Coupon"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Coupon Code *</label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="font-mono font-bold tracking-widest uppercase text-sm"
              />
              <p className="text-[10px] text-gray-400">This is what customers type at checkout</p>
            </div>

            {/* Label */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Display Label *</label>
              <Input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Extra 20% off"
              />
              <p className="text-[10px] text-gray-400">Shown to customers on the homepage</p>
            </div>

            {/* Discount type + value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Discount Type</label>
                <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v as any }))}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (RWF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">
                  {form.discountType === "percentage" ? "Discount %" : "Amount (RWF)"}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Max uses + expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Max Uses</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={form.maxUses ?? ""}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="Unlimited"
                    className="text-xs h-9"
                  />
                </div>
                <p className="text-[10px] text-gray-400">Leave blank = unlimited</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Expires On</label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="text-xs h-9"
                />
                <p className="text-[10px] text-gray-400">Leave blank = no expiry</p>
              </div>
            </div>

            {/* Badge color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600">Badge Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {BADGE_COLORS.map(bc => (
                  <button
                    key={bc.value}
                    onClick={() => setForm(f => ({ ...f, badgeColor: bc.value }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.badgeColor === bc.value ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: bc.value }}
                    title={bc.label}
                  />
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-700">Active</p>
                <p className="text-[10px] text-gray-400">Show this coupon on the homepage</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
            </div>

            {/* Preview */}
            {form.code && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Preview</p>
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 w-fit" style={{ border: `1.5px dashed ${form.badgeColor}`, backgroundColor: `${form.badgeColor}12` }}>
                  <span className="text-[10px] font-bold" style={{ color: form.badgeColor }}>{form.label || "Label"}</span>
                  <span className="text-[9px] font-black bg-white px-1.5 py-0.5 rounded-full" style={{ color: form.badgeColor, border: `1px solid ${form.badgeColor}40` }}>{form.code || "CODE"}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); setForm(empty); setEditId(null); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="font-bold"
            >
              {editId ? "Save Changes" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
