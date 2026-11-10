import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, Calendar, CreditCard, ShoppingBag, Hash } from "lucide-react";

export default function OrderHistory() {
  const { data: customer, isLoading: customerLoading } = useQuery<{ id: number; fullName: string } | null>({
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

  const { data: orders, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["/api/customer/orders"],
    enabled: !!customer,
    queryFn: async () => {
      const res = await fetch("/api/customer/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "processing": return "secondary";
      case "shipped": return "outline";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = customerLoading || (!!customer && ordersLoading);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
            <p className="text-muted-foreground mt-2">
              All orders placed with your account
            </p>
          </div>

          {!customerLoading && !customer ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>Sign In to View Your Order History</CardTitle>
              <CardDescription className="mt-2">
                Please sign in to see the orders you've placed with this account.
              </CardDescription>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse h-32" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>No Orders Yet</CardTitle>
              <CardDescription className="mt-2">
                You haven't placed any orders with this account's email yet.
              </CardDescription>
            </Card>
          ) : (
            <div className="space-y-6">
              <Accordion type="single" collapsible className="space-y-4">
                {orders.map((order) => (
                  <AccordionItem key={order.id} value={`order-${order.id}`} className="bg-card border rounded-xl overflow-hidden px-0">
                    <AccordionTrigger className="hover:no-underline px-6 py-4">
                      <div className="flex flex-1 items-center justify-between text-left">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">Order #{order.id}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(order.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 mr-4">
                          <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                          <Badge variant={getStatusColor(order.status) as any} className="text-[10px] uppercase font-bold px-2 py-0">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                          <div>
                            <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
                              <Hash className="h-3 w-3" /> Tracking Code
                            </p>
                            <p className="font-semibold uppercase text-xs">{order.trackingCode || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-1 flex items-center gap-2">
                              <CreditCard className="h-3 w-3" /> Payment Method
                            </p>
                            <p className="font-semibold uppercase text-xs">{order.paymentProvider || order.paymentMethod || "-"}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Items</h3>
                          <div className="space-y-3">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                <div>
                                  <p className="font-bold">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.storage && `Storage: ${item.storage}`}
                                    {item.storage && item.color && " | "}
                                    {item.color && `Color: ${item.color}`}
                                    { (item.storage || item.color) && " | " }
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                                <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
