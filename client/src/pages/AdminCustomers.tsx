import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users, Search, Mail, Phone, Calendar, ShoppingBag, DollarSign,
  Eye, KeyRound, ChevronRight, X, TrendingUp, Package, Clock, CheckCircle2,
  ArrowUpRight, Loader2, UserCheck, RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  paid:      "bg-emerald-100 text-emerald-700",
  delivered: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/customers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
  });

  const { data: selectedCustomer, isLoading: detailLoading } = useQuery<any>({
    queryKey: ["/api/admin/customers", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/admin/customers/${selectedId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load customer");
      return res.json();
    },
    enabled: !!selectedId,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/customers/${selectedId}/reset-password`, { newPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "The customer's password has been updated." });
      setResetDialogOpen(false);
      setNewPassword("");
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = customers.filter((c) =>
    !search ||
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  // Summary stats
  const totalSpent = customers.reduce((s: number, c: any) => s + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((s: number, c: any) => s + (c.orderCount || 0), 0);
  const thisMonth = customers.filter((c: any) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Customers</h2>
          <p className="text-xs text-gray-400 mt-0.5">{customers.length} registered accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, accent: "text-violet-500", bg: "bg-violet-50" },
          { label: "New This Month", value: thisMonth, icon: UserCheck, accent: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Total Orders", value: totalOrders, icon: ShoppingBag, accent: "text-orange-500", bg: "bg-orange-50" },
          { label: "Revenue (Paid)", value: fmt(totalSpent), icon: TrendingUp, accent: "text-teal-600", bg: "bg-teal-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className={cn("inline-flex rounded-xl p-2 mb-3", s.bg)}>
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-gray-200 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-bold">Loading customers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm font-bold">{search ? "No customers match your search" : "No customers yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden lg:table-cell">Joined</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:table-cell">Spent</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c: any) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-primary">
                            {(c.fullName || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{c.fullName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-gray-600 font-medium">{c.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">
                        {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn(
                        "inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-black",
                        c.orderCount > 0 ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                      )}>
                        {c.orderCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                      <span className="font-bold text-gray-800">{c.totalSpent > 0 ? fmt(c.totalSpent) : "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {detailLoading || !selectedCustomer ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-2xl font-black text-primary">
                    {(selectedCustomer.fullName || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-lg font-black text-gray-900 leading-tight">{selectedCustomer.fullName}</SheetTitle>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{selectedCustomer.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Member since {selectedCustomer.createdAt ? format(new Date(selectedCustomer.createdAt), "MMMM d, yyyy") : "—"}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 px-6 py-5 space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Spending Summary */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-primary/5 rounded-xl p-3 text-center">
                      <ShoppingBag className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-lg font-black text-gray-900">{selectedCustomer.orderCount}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Orders</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center col-span-2">
                      <DollarSign className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-lg font-black text-gray-900">{fmt(selectedCustomer.totalSpent || 0)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Total Spent (Paid)</p>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order History</p>
                  {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selectedCustomer.orders.map((order: any) => (
                        <div key={order.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-black text-gray-800">Order #{order.id}</span>
                              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase", STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500")}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""} · {order.paymentMethod}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy · h:mm a") : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-gray-900">{fmt(order.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Actions</p>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 rounded-xl border-dashed"
                    onClick={() => {
                      window.open(`mailto:${selectedCustomer.email}`);
                    }}
                  >
                    <Mail className="h-4 w-4 text-teal-600" />
                    <span className="font-bold text-sm">Send Email</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto text-gray-300" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => { setNewPassword(""); setResetDialogOpen(true); }}
                  >
                    <KeyRound className="h-4 w-4" />
                    <span className="font-bold text-sm">Reset Password</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Set a new password for <strong>{selectedCustomer?.fullName}</strong>. They'll be able to sign in with this new password immediately.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">New Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 hover:text-gray-700 uppercase tracking-widest"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
            >
              {resetPasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RotateCcw className="h-4 w-4 mr-1.5" /> Reset Password</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
