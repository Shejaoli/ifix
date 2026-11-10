import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Search, X, Mail, Phone, Calendar, ShoppingBag, TrendingUp,
  KeyRound, ChevronRight, ArrowLeft, Package, Loader2, Eye, EyeOff,
  UserCircle2, CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(v);

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-teal-100 text-teal-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const resetSchema = z.object({
  newPassword: z.string().min(8, "Minimum 8 characters"),
  confirm: z.string(),
}).refine(d => d.newPassword === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

type ResetForm = z.infer<typeof resetSchema>;

function StatCard({ icon: Icon, label, value, accent }: any) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-4")}>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", accent)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-xl font-black tracking-tight text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function AdminCustomers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: customers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: detail, isLoading: loadingDetail } = useQuery<any>({
    queryKey: ["/api/admin/customers", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/customers/${selectedId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: selectedId !== null,
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirm: "" },
  });

  const resetMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/customers/${id}/reset-password`, { newPassword });
      if (!res.ok) throw new Error("Reset failed");
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "Customer's password has been updated." });
      setResetOpen(false);
      resetForm.reset();
    },
    onError: () => toast({ variant: "destructive", title: "Failed", description: "Could not reset password." }),
  });

  const filtered = customers.filter(c =>
    search === "" ||
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const totalRevenue = customers.reduce((s: number, c: any) => s + (c.totalSpent || 0), 0);
  const activeThisMonth = customers.filter((c: any) => {
    if (!c.lastOrderAt) return false;
    const d = new Date(c.lastOrderAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (selectedId !== null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Customers
          </button>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : detail ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-5">
              <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <UserCircle2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-lg text-gray-900 truncate">{detail.customer.fullName}</h2>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{detail.customer.email}</span>
                  </div>
                  {detail.customer.phone && (
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{detail.customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Joined {fmtDate(detail.customer.createdAt)}</span>
                  </div>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <a
                    href={`mailto:${detail.customer.email}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Email Customer
                  </a>
                  <button
                    onClick={() => { setResetOpen(true); resetForm.reset(); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-orange-200 text-sm font-bold text-orange-700 hover:bg-orange-50 transition-all"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Orders</p>
                  <p className="text-2xl font-black text-gray-900">{detail.orders.length}</p>
                </div>
                <div className="rounded-2xl border bg-white p-4 shadow-sm text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Spent</p>
                  <p className="text-lg font-black text-primary truncate">{fmt(detail.orders.reduce((s: number, o: any) => s + o.totalAmount, 0))}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Order History</h3>
              {detail.orders.length === 0 ? (
                <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
                  <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="font-bold text-gray-400">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.orders.map((o: any) => (
                    <div key={o.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-black text-sm">Order #{o.id}</span>
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full capitalize", STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600")}>
                          {o.status}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {(o.items as any[]).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-gray-600">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-bold">{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-xs text-gray-400">{fmtDate(o.createdAt)}</span>
                        <span className="font-black text-sm text-primary">{fmt(o.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Customer Password</DialogTitle>
              <DialogDescription>
                Set a new password for <strong>{detail?.customer?.fullName}</strong>. Share it with them securely.
              </DialogDescription>
            </DialogHeader>
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(d => resetMutation.mutate({ id: selectedId!, newPassword: d.newPassword }))} className="space-y-4 pt-2">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" className="pr-10" {...field} />
                          <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showConfirm ? "text" : "password"} placeholder="Repeat password" className="pr-10" {...field} />
                          <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setResetOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" disabled={resetMutation.isPending} className="flex-1">
                    {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    Reset Password
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage registered customer accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Customers" value={customers.length} accent="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="Active This Month" value={activeThisMonth} accent="bg-emerald-500" />
        <StatCard icon={CircleDollarSign} label="Total Revenue" value={fmt(totalRevenue)} accent="bg-primary" />
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-primary transition-colors bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-400">{search ? "No customers match your search" : "No customers yet"}</p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b bg-gray-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Joined</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Spent</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400"></span>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-black text-sm uppercase">
                    {c.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 grid md:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-x-4 gap-y-0.5 items-center">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-400 truncate md:hidden">{c.email}</p>
                    </div>
                    <div className="hidden md:block min-w-0">
                      <p className="text-xs text-gray-600 truncate">{c.email}</p>
                      {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                    </div>
                    <p className="hidden md:block text-xs text-gray-500 whitespace-nowrap">{fmtDate(c.createdAt)}</p>
                    <div className="hidden md:flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{c.orderCount}</span>
                    </div>
                    <p className="hidden md:block text-xs font-black text-primary whitespace-nowrap">{fmt(c.totalSpent)}</p>
                    <ChevronRight className="hidden md:block w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors justify-self-end" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 md:hidden pl-13">
                  <div className="flex items-center gap-3 pl-13">
                    <span className="text-[10px] text-gray-400">{fmtDate(c.createdAt)}</span>
                    <span className="text-[10px] font-bold text-gray-600">{c.orderCount} orders</span>
                    <span className="text-[10px] font-black text-primary">{fmt(c.totalSpent)}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-400 font-semibold">
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
