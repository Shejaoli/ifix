import { formatSiteCurrency } from "@/lib/site-currency";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, MessageCircle, Truck, CreditCard as CardIcon, Wallet, Calendar as CalendarIcon, Package, ArrowLeft, ArrowRight, ChevronRight, Copy, MapPin, Mail } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { getOrderSource } from "@/lib/order-source";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertOrderSchema } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DELIVERY_ADDRESS_STORAGE_KEY, readSavedDeliveryAddress, type DeliveryAddress } from "@/lib/delivery-address";
import { useProducts } from "@/hooks/use-products";
import { getProductPricing } from "@shared/product-pricing";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  totalPrice: number;
  quantity: number;
  storage: string;
  color: string;
  imageUrl: string;
  originalPrice?: number;
}

// Delivery/pickup time slots, with 24-hour end times used to detect passed slots
const TIME_SLOTS = [
  { value: "09:00 AM - 12:00 PM", endHour: 12, endMinute: 0 },
  { value: "12:00 PM - 03:00 PM", endHour: 15, endMinute: 0 },
  { value: "03:00 PM - 06:00 PM", endHour: 18, endMinute: 0 },
  { value: "06:00 PM - 09:00 PM", endHour: 21, endMinute: 0 },
];

function isTimeSlotPast(slot: { endHour: number; endMinute: number }, selectedDate: Date | undefined) {
  if (!selectedDate) return false;
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();
  if (!isToday) return false;
  const slotEnd = new Date(selectedDate);
  slotEnd.setHours(slot.endHour, slot.endMinute, 0, 0);
  return now >= slotEnd;
}

// Mobile Money networks: dial code to pay IFIX's merchant number, and the
// phone number prefixes customers must pay from on each network.
const MOMO_NETWORKS: Record<string, { dialCode: string; prefixes: string[] }> = {
  "MTN Mobile Money": { dialCode: "*182*1*1*0788865247#", prefixes: ["078", "079"] },
  "Airtel Money": { dialCode: "*182*1*2*0788865247#", prefixes: ["072", "073"] },
};

function isMomoNetwork(method: string): method is keyof typeof MOMO_NETWORKS {
  return method === "MTN Mobile Money" || method === "Airtel Money";
}

function validateMomoPhone(value: string, network: string): string {
  const digits = value.replace(/\D/g, "");
  const config = MOMO_NETWORKS[network];
  if (!config) return "";
  if (digits.length !== 10 || !config.prefixes.some((p) => digits.startsWith(p))) {
    return `Enter a valid ${network} number starting with ${config.prefixes.join(" or ")} (10 digits)`;
  }
  return "";
}

// Single-page checkout (Phase 11): only what is needed to identify the buyer.
// Sharing a GPS location is optional.
const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  latitude: z.string(),
  longitude: z.string(),
  paymentMethod: z.string().min(1, "Select a payment method"),
});

type ShippingForm = z.infer<typeof checkoutSchema>;

function CheckoutSingle({
  form,
  cart,
  total,
  formatPrice,
  isLoadingProducts,
  setLocation,
  setCreatedOrder,
}: {
  form: any,
  cart: any[],
  total: number,
  formatPrice: (p: number) => string,
  isLoadingProducts: boolean,
  setLocation: (l: string) => void,
  setCreatedOrder: (o: any) => void,
}) {
  const { toast } = useToast();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [savedDeliveryAddress, setSavedDeliveryAddress] = useState<DeliveryAddress | null>(() => readSavedDeliveryAddress());

  const watchPaymentMethod = form.watch("paymentMethod");
  const watchLatitude = form.watch("latitude");
  const watchLongitude = form.watch("longitude");
  const hasLocation = (!!watchLatitude && !!watchLongitude) || Boolean(savedDeliveryAddress?.district);

  useEffect(() => {
    const syncDeliveryAddress = () => setSavedDeliveryAddress(readSavedDeliveryAddress());
    window.addEventListener("ifix-delivery-address-changed", syncDeliveryAddress);
    return () => window.removeEventListener("ifix-delivery-address-changed", syncDeliveryAddress);
  }, []);

  // Mobile Money: collect and validate the customer's own paying-from number
  const [momoPhone, setMomoPhone] = useState("");
  const [momoInput, setMomoInput] = useState("");
  const [momoError, setMomoError] = useState("");
  const [momoDialogOpen, setMomoDialogOpen] = useState(false);

  useEffect(() => {
    if (!isMomoNetwork(watchPaymentMethod)) return;
    if (momoPhone && !validateMomoPhone(momoPhone, watchPaymentMethod)) return;
    if (!momoPhone) {
      setMomoInput("");
      setMomoError("");
      setMomoDialogOpen(true);
    } else if (validateMomoPhone(momoPhone, watchPaymentMethod)) {
      setMomoPhone("");
      setMomoInput("");
      setMomoError("");
      setMomoDialogOpen(true);
    }
  }, [watchPaymentMethod]);

  const handleMomoConfirm = () => {
    if (validateMomoPhone(momoInput, watchPaymentMethod)) return;
    setMomoPhone(momoInput.replace(/\D/g, ""));
    setMomoDialogOpen(false);
  };

  const handleMomoDialogChange = (open: boolean) => {
    setMomoDialogOpen(open);
    if (!open) {
      form.setValue("paymentMethod", "");
      setMomoPhone("");
      setMomoInput("");
      setMomoError("");
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location not supported",
        description: "Your browser doesn't support sharing your location. Please try another browser or device.",
      });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", String(position.coords.latitude), { shouldValidate: true });
        form.setValue("longitude", String(position.coords.longitude), { shouldValidate: true });
        setGpsLoading(false);
        toast({
          title: "Location shared",
          description: "Your location will help our delivery person find you.",
        });
      },
      () => {
        setGpsLoading(false);
        toast({
          variant: "destructive",
          title: "Couldn't get your location",
          description: "Please allow location access for this site in your browser settings, turn off any VPN, and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearLocation = () => {
    form.setValue("latitude", "");
    form.setValue("longitude", "");
    sessionStorage.removeItem(DELIVERY_ADDRESS_STORAGE_KEY);
    setSavedDeliveryAddress(null);
    window.dispatchEvent(new Event("ifix-delivery-address-changed"));
  };

  const orderMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await apiRequest("POST", "/api/orders", values);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to place order");
      }
      return res.json();
    },
    onSuccess: (order) => {
      setCreatedOrder(order);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("storage"));
      localStorage.removeItem("checkout_shipping");
      sessionStorage.removeItem(DELIVERY_ADDRESS_STORAGE_KEY);
      window.dispatchEvent(new Event("ifix-delivery-address-changed"));
      setLocation("/order-success");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Order failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ShippingForm) => {
    if (isMomoNetwork(data.paymentMethod) && !momoPhone) {
      setMomoDialogOpen(true);
      return;
    }

    const selectedAddress = savedDeliveryAddress || readSavedDeliveryAddress();
    const orderData = {
      source: getOrderSource(),
      customerName: data.fullName.trim(),
      customerPhone: data.phone,
      customerEmail: data.email,
      deliveryLocation: selectedAddress
        ? [selectedAddress.address, selectedAddress.landmark].filter(Boolean).join(" — ") || `${selectedAddress.district}, ${selectedAddress.province}`
        : hasLocation
        ? "Live GPS location shared by customer"
        : "GPS location not shared; contact customer to confirm delivery address",
      deliveryProvince: selectedAddress?.province || null,
      deliveryDistrict: selectedAddress?.district || null,
      deliverySector: selectedAddress?.sector || null,
      deliveryCell: selectedAddress?.cell || null,
      deliveryLandmark: selectedAddress?.landmark || null,
      deliveryLatitude: selectedAddress?.latitude || data.latitude || null,
      deliveryLongitude: selectedAddress?.longitude || data.longitude || null,
      orderType: "Delivery",
      paymentMethod: data.paymentMethod,
      paymentProvider: isMomoNetwork(data.paymentMethod) ? data.paymentMethod : null,
      paymentReference: isMomoNetwork(data.paymentMethod) ? momoPhone : null,
      totalAmount: total,
      status: "pending",
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        storage: item.storage,
        color: item.color
      })),
    };

    orderMutation.mutate(orderData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Contact</h2>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="email" placeholder="Email" className="h-12 rounded-xl border-2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Full names" className="h-12 rounded-xl border-2" {...field} />
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
                  <FormControl>
                    <Input type="tel" placeholder="Phone number" className="h-12 rounded-xl border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Delivery location</h2>
          {hasLocation ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <div className="min-w-0">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {savedDeliveryAddress ? "Delivery address selected" : "Location shared"}
                </span>
                {savedDeliveryAddress && <p className="mt-1 pl-6 text-xs text-muted-foreground">{[savedDeliveryAddress.address, savedDeliveryAddress.landmark, savedDeliveryAddress.cell, savedDeliveryAddress.sector, savedDeliveryAddress.district, savedDeliveryAddress.province].filter(Boolean).join(", ")}</p>}
              </div>
              <div className="flex items-center gap-3">
                {savedDeliveryAddress && <button type="button" onClick={() => window.dispatchEvent(new Event("ifix-open-delivery-location"))} className="text-xs font-semibold text-primary underline underline-offset-2">Change</button>}
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleShareLocation}
              disabled={gpsLoading}
              className="h-12 w-full rounded-xl border-2 gap-2"
            >
              <MapPin className="h-4 w-4" />
              {gpsLoading ? "Getting your location\u2026" : "Share My Live Location (Optional)"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Delivery is <span className="font-bold text-green-500">FREE</span>. Sharing your location is optional; you can still order without it. Our team may contact you to confirm your delivery address.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Payment Method</h2>
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col gap-4"
                  >
                    <FormItem className="flex items-start space-x-4 space-y-0 rounded-2xl border-2 border-border p-6 cursor-pointer hover:bg-accent/5 transition-colors data-[state=checked]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="Cash on Delivery" className="mt-1" />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="font-bold text-lg flex items-center gap-2">
                          <Truck className="h-5 w-5 text-primary" />
                          Cash on Delivery
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">Pay with cash when your order is delivered to your doorstep.</p>
                      </div>
                    </FormItem>

                    <FormItem className="flex flex-col rounded-2xl border-2 border-border overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors data-[state=checked]:border-primary">
                      <div className="flex items-start space-x-4 p-6">
                        <FormControl>
                          <RadioGroupItem value="MTN Mobile Money" className="mt-1" />
                        </FormControl>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="font-bold text-lg flex items-center gap-2">
                              <Wallet className="h-5 w-5 text-primary" />
                              MTN Mobile Money
                            </FormLabel>
                            <img src="/images/mtn-momo-logo-20261010.png" alt="MTN MoMo from MTN" className="h-12 w-12 object-contain" />
                          </div>
                          <p className="text-sm text-muted-foreground">Pay using MTN Mobile Money. Quick and secure mobile payments.</p>
                          {watchPaymentMethod === "MTN Mobile Money" && momoPhone && (
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-sm font-bold text-primary">Paying from: {momoPhone}</p>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setMomoInput(momoPhone); setMomoError(""); setMomoDialogOpen(true); }}
                                className="text-xs underline text-muted-foreground hover:text-foreground"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Dialog open={momoDialogOpen} onOpenChange={handleMomoDialogChange}>
            <DialogContent className="max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle>Enter your {isMomoNetwork(watchPaymentMethod) ? watchPaymentMethod : ""} number</DialogTitle>
                <DialogDescription>
                  This is the number you'll pay from. We use it to match your payment to your order.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder={isMomoNetwork(watchPaymentMethod) ? MOMO_NETWORKS[watchPaymentMethod].prefixes.map((p) => `${p}XXXXXXX`).join(" or ") : ""}
                  value={momoInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMomoInput(val);
                    setMomoError(val ? validateMomoPhone(val, watchPaymentMethod) : "");
                  }}
                  className="text-lg font-bold"
                  autoFocus
                />
                {momoError && <p className="text-sm text-destructive font-medium">{momoError}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleMomoDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleMomoConfirm} disabled={!!validateMomoPhone(momoInput, watchPaymentMethod)}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Button
            type="submit" 
            disabled={orderMutation.isPending || isLoadingProducts || !watchPaymentMethod || (isMomoNetwork(watchPaymentMethod) && !momoPhone)}
            className="w-full py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter"
          >
            {isLoadingProducts ? "Updating prices..." : orderMutation.isPending ? "Processing..." : "Pay Now"}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-center text-xs text-muted-foreground font-medium">
            🔒 Secure transaction. Your data is protected by industry-standard encryption.
          </p>
        </div>
      </form>
    </Form>
  );
}

function OrderConfirmation({ order, formatPrice }: { order: any; formatPrice: (p: number) => string }) {
  const { toast } = useToast();
  const isIpayMtnOrder = order?.paymentMethod === "MTN Mobile Money" && !!order?.paymentReference;
  const paymentStatusQuery = useQuery<{ paymentState: string; orderStatus: string }, Error>({
    queryKey: ["ipay-payment-status", order?.trackingCode, order?.customerPhone],
    enabled: isIpayMtnOrder && !!order?.trackingCode && !!order?.customerPhone,
    queryFn: async () => {
      const params = new URLSearchParams({ phone: order.customerPhone });
      const response = await fetch(
        `/api/orders/${encodeURIComponent(order.trackingCode)}/payment-status?${params}`,
      );
      if (!response.ok) throw new Error("Payment status is not available yet");
      return response.json();
    },
    refetchInterval: (query) => {
      const state = query.state.data?.paymentState || order?.paymentState;
      return state === "SUCCEEDED" || state === "FAILED" || state === "CANCELLED" ? false : 5000;
    },
  });
  const paymentState = paymentStatusQuery.data?.paymentState || order?.paymentState || "CREATED";

  const copyTrackingCode = () => {
    if (!order?.trackingCode) return;
    navigator.clipboard.writeText(order.trackingCode);
    toast({ title: "Copied", description: "Tracking code copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center space-y-4 mb-10">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">
              {isIpayMtnOrder && paymentState === "SUCCEEDED"
                ? "MTN Payment Confirmed!"
                : isIpayMtnOrder && (paymentState === "FAILED" || paymentState === "CANCELLED")
                  ? "MTN Payment Not Completed"
                  : isIpayMtnOrder
                    ? "Approve the MTN Payment"
                    : "Order Placed Successfully!"}
            </h1>
            <p className="text-muted-foreground text-base">
              {isIpayMtnOrder && paymentState === "SUCCEEDED"
                  ? `Thank you${order?.customerName ? `, ${order.customerName}` : ""}. Your payment has been confirmed.`
                  : isIpayMtnOrder && order?.paymentMessage
                    ? order.paymentMessage
                  : isIpayMtnOrder && (paymentState === "FAILED" || paymentState === "CANCELLED")
                    ? "The payment was not completed. Contact us with your order tracking code before trying again."
                    : isIpayMtnOrder
                      ? "Check your phone and approve the MTN Mobile Money prompt. Keep this page open while we confirm the payment. Do not submit another payment while it is processing."
                      : `Thank you${order?.customerName ? `, ${order.customerName}` : ""}. We've received your order and will be in touch shortly.`}
            </p>
          </div>

          {order?.trackingCode && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-6 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Your Tracking Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-black tracking-[0.2em] text-primary">{order.trackingCode}</span>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={copyTrackingCode} data-testid="button-copy-tracking-code">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Save this code — use it with your phone number on the{" "}
                <Link href="/track-order" className="underline font-bold text-foreground">Track Order</Link> page to check your order status anytime.
              </p>
            </div>
          )}

          {order?.customerEmail && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">Your order details are on the way</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We’re sending your confirmation to <span className="font-semibold text-foreground break-all">{order.customerEmail}</span>.
                  {" "}Please check your inbox and your Spam/Junk folder. We’ll email you again when your payment or order status changes.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            {order?.items?.length > 0 && (
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {item.storage ? `• ${item.storage}` : ""} {item.color ? `• ${item.color}` : ""}
                      </p>
                    </div>
                    <p className="font-bold text-sm text-primary">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                <Separator />
              </div>
            )}
            {order?.deliveryFee > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Delivery Fee</span>
                <span className="font-bold">{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-black text-lg">Total</span>
              <span className="font-black text-2xl text-primary">{formatPrice(order?.totalAmount || 0)}</span>
            </div>
            {order?.deliveryLocation && (
              <div className="flex items-start gap-2 pt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{order.deliveryLocation}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link href="/track-order" className="flex-1">
              <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">Track Your Order</Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full h-12 font-bold rounded-2xl">Continue Shopping</Button>
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  const { data: customer } = useQuery<any>({
    queryKey: ["/api/customer/me"],
    queryFn: async () => {
      const res = await fetch("/api/customer/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 30000,
  });

  const shippingForm = useForm<ShippingForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      latitude: "",
      longitude: "",
      paymentMethod: "Cash on Delivery",
    },
  });

  useEffect(() => {
    const isOrderSuccessRoute = location === "/order-success" || location === "/order/success";
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (parsedCart.length === 0 && !isOrderSuccessRoute) {
        setLocation("/shop");
      }
      setCart(parsedCart);
    } else if (!isOrderSuccessRoute) {
      setLocation("/shop");
    }

  }, [location, setLocation]);

  useEffect(() => {
    if (products.length === 0 || cart.length === 0) return;
    const repricedCart = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return item;
      const storageOffset = product.variations?.storage?.find((option) => option.option === item.storage)?.priceOffset ?? 0;
      const pricing = getProductPricing(product, storageOffset);
      return {
        ...item,
        name: product.name,
        imageUrl: product.imageUrl,
        price: pricing.salePrice,
        originalPrice: pricing.hasDiscount ? pricing.regularPrice : undefined,
        totalPrice: pricing.salePrice * item.quantity,
      };
    });
    if (JSON.stringify(repricedCart) !== JSON.stringify(cart)) {
      setCart(repricedCart);
      localStorage.setItem("cart", JSON.stringify(repricedCart));
      window.dispatchEvent(new Event("storage"));
    }
  }, [products, cart]);

  // Auto-fill from customer account (only empty fields, never overwrites what was typed)
  useEffect(() => {
    if (!customer) return;
    const fillIfEmpty = (name: "email" | "fullName" | "phone", value?: string) => {
      if (value && !shippingForm.getValues(name)) shippingForm.setValue(name, value);
    };
    fillIfEmpty("email", customer.email);
    fillIfEmpty("fullName", customer.fullName);
    fillIfEmpty("phone", customer.phone);
  }, [customer]);

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  // Shipping is free for every order (Phase 11)
  const total = subtotal;

  const formatPrice = formatSiteCurrency;

  const isOrderSuccess = location === "/order-success" || location === "/order/success";

  if (isOrderSuccess) {
    if (createdOrder) {
      return <OrderConfirmation order={createdOrder} formatPrice={formatPrice} />;
    }
    // Direct visit or page refresh with no order in memory — point them to Track Order instead of a blank form
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20 text-center">
          <div className="max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Order details unavailable here</h1>
            <p className="text-muted-foreground">
              If you just placed an order, check your tracking code and phone number on the Track Order page.
            </p>
            <Link href="/track-order">
              <Button className="h-12 px-8 font-bold rounded-2xl">Track Your Order</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Auth gate removed (Phase 9): guests and logged-in customers alike go
  // straight to the shipping form. Logged-in customers still get their
  // details auto-filled (see the effect above) — no login UI is shown here.

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-12">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-black tracking-tighter uppercase">Checkout</h1>
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">Checkout</span>
              </div>
            </div>

            <CheckoutSingle
              form={shippingForm}
              cart={cart}
              total={total}
              formatPrice={formatPrice}
              isLoadingProducts={isLoadingProducts}
              setLocation={setLocation}
              setCreatedOrder={setCreatedOrder}
            />
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
                <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  Order Summary
                </h2>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border bg-muted">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        <h3 className="text-sm font-bold truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">{item.storage} / {item.color}</p>
                        <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4 pt-8 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-500 font-bold uppercase tracking-widest text-[10px] bg-green-500/10 px-2 py-1 rounded-full">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-black tracking-tight">Total</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground uppercase font-black tracking-widest block">Amount due</span>
                      <span className="text-3xl font-black tracking-tighter text-primary">{formatPrice(total)}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">Display conversion only. Order and payment amounts are recorded in RWF.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Need help with your order?</p>
                    <p className="text-xs text-muted-foreground">Chat with our support team on WhatsApp for immediate assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
