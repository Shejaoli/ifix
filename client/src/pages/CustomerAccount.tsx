import { formatSiteCurrency } from "@/lib/site-currency";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User, Phone, LogOut, Package, ChevronRight, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import type { Customer, Order } from "@shared/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-500",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function CustomerAccount() {
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: me, isLoading: loadingMe } = useQuery<Omit<Customer, "passwordHash">>({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/customers/orders"],
    enabled: !!me,
    retry: false,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: me?.fullName ?? "",
      phone: me?.phone ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("PATCH", "/api/customers/me", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/customers/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({ title: "Signed out", description: "You have been logged out." });
      navigate("/account");
    },
  });

  if (loadingMe) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!me) {
    navigate("/account");
    return null;
  }

  const fmt = formatSiteCurrency;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{me.fullName}</h1>
                <p className="text-sm text-muted-foreground">{me.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="gap-2"
            >
              {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Sign Out
            </Button>
          </div>

          <div className="flex gap-1 border-b mb-6">
            <button
              onClick={() => setTab("orders")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              My Orders
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Edit Profile
            </button>
          </div>

          {tab === "orders" && (
            <div className="space-y-3">
              {loadingOrders ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-semibold text-lg">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Your orders will appear here once you place one.</p>
                  <Button onClick={() => navigate("/shop")} className="mt-2">Browse Products</Button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">Order #{order.id}</span>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.orderDate} {order.orderTime && `· ${order.orderTime}`}
                    </div>
                    <div className="space-y-1">
                      {(order.items as any[]).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                          <span className="font-medium">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-bold text-primary">{fmt(order.totalAmount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="rounded-xl border bg-card p-6 max-w-md">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Input value={me.email} disabled className="bg-muted/50 cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="+250 788 000 000" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
