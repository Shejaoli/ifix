import { formatSiteCurrency } from "@/lib/site-currency";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Package, Calendar, MapPin, Hash, Phone, Clock, FileText, CheckCircle2, Truck, PackageCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const trackSchema = z.object({
  trackingCode: z.string().min(1, "Tracking code is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type TrackForm = z.infer<typeof trackSchema>;

const STATUS_STEPS = [
  { label: "Order Placed", status: "pending", icon: FileText, color: "text-teal-600" },
  { label: "Paid", status: "paid", icon: CheckCircle2, color: "text-green-500" },
  { label: "Processing", status: "processing", icon: Package, color: "text-yellow-500" },
  { label: "Shipped", status: "shipped", icon: Truck, color: "text-purple-500" },
  { label: "Completed", status: "completed", icon: PackageCheck, color: "text-primary" },
];

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "completed"];

function isStepComplete(stepStatus: string, currentStatus: string) {
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const currentIdx = STATUS_ORDER.indexOf((currentStatus || "").toLowerCase());
  if (currentIdx === -1) return stepStatus === "pending"; // unknown/cancelled statuses still show order as placed
  return stepIdx <= currentIdx;
}

export default function TrackOrder() {
  const [order, setOrder] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<TrackForm>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      trackingCode: "",
      phone: "",
    },
  });

  const trackMutation = useMutation({
    mutationFn: async (values: TrackForm) => {
      const cleanCode = values.trackingCode.trim().toUpperCase();
      const res = await apiRequest("GET", `/api/orders/public/track?trackingCode=${encodeURIComponent(cleanCode)}&phone=${encodeURIComponent(values.phone)}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Tracking failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setOrder(data);
        setNotFound(false);
      } else {
        setOrder(null);
        setNotFound(true);
      }
    },
  });

  const formatPrice = formatSiteCurrency;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "confirmed": return "bg-teal-600/10 text-teal-600 border-teal-600/20";
      case "paid": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "delivered": return "bg-primary/10 text-primary border-primary/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Track Your Order</h1>
            <p className="text-muted-foreground text-lg">
              Enter your Tracking Code and Phone Number to see your order status.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => trackMutation.mutate(data))} className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="trackingCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Code</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="e.g. 7XJ9KQ2M" {...field} className="pl-9 h-12 uppercase tracking-widest" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="0788XXXXXX" {...field} className="pl-9 h-12" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="sm:col-span-2 h-12 text-lg font-bold mt-2"
                    disabled={trackMutation.isPending}
                  >
                    {trackMutation.isPending ? (
                      "Searching..."
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" /> Track Order
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {notFound && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6 text-center text-destructive font-medium">
                Order not found. Please check your Order ID and Phone Number.
              </CardContent>
            </Card>
          )}

          {order && (
            <Card className="overflow-hidden shadow-lg border-2 border-primary/10">
              <CardHeader className="bg-muted/50 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Package className="h-6 w-6 text-primary" />
                      Order #{order.trackingCode}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(order.createdAt), "PPP p")}
                    </div>
                  </div>
                  <Badge variant="outline" className={`px-4 py-1 text-sm font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {!["cancelled", "refunded", "failed"].includes((order.status || "").toLowerCase()) && (
                  <div className="border p-4 rounded-xl bg-muted/30">
                    <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Order Timeline</h4>
                    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                      {STATUS_STEPS.map((step, idx) => {
                        const completed = isStepComplete(step.status, order.status);
                        return (
                          <div key={idx} className="relative flex items-center gap-4">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background z-10 transition-colors duration-200",
                              completed ? "border-primary" : "border-muted"
                            )}>
                              <step.icon className={cn("h-5 w-5", completed ? step.color : "text-muted-foreground")} />
                            </div>
                            <p className={cn("text-sm font-semibold", completed ? "text-foreground" : "text-muted-foreground")}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Delivery Details
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-muted-foreground">{order.customerPhone}</p>
                      <p className="text-muted-foreground">{order.deliveryLocation}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Payment Info
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                      <p className="text-muted-foreground">Method: <span className="text-foreground font-medium">{order.paymentMethod}</span></p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Items Ordered</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/50">
                        <div>
                          <p className="font-bold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x {item.storage ? `• ${item.storage}` : ""} {item.color ? `• ${item.color}` : ""}
                          </p>
                        </div>
                        <p className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
