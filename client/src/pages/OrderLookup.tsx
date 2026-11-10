import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, Calendar, CreditCard, ShoppingBag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";

const lookupSchema = z.object({
  email: z.string().email("Invalid email address"),
  orderNumber: z.string().min(1, "Order number is required"),
});

export default function OrderLookup() {
  const [order, setOrder] = useState<any>(null);

  const lookupMutation = useMutation({
    mutationFn: async (values: z.infer<typeof lookupSchema>) => {
      const res = await apiRequest("POST", "/api/orders/lookup", values);
      return res.json();
    },
    onSuccess: (data) => {
      setOrder(data);
    },
    onError: () => {
      setOrder(null);
    }
  });

  const form = useForm<z.infer<typeof lookupSchema>>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      email: "",
      orderNumber: "",
    },
  });

  const onSubmit = (values: z.infer<typeof lookupSchema>) => {
    lookupMutation.mutate(values);
  };

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Lookup Your Order</CardTitle>
              <CardDescription>Enter your email and order number to view your order details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={lookupMutation.isPending}>
                    {lookupMutation.isPending ? "Searching..." : "View Order"}
                  </Button>
                </form>
              </Form>
              {lookupMutation.isError && (
                <p className="text-destructive text-sm mt-4 text-center">Order not found. Please check your details and try again.</p>
              )}
            </CardContent>
          </Card>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Order Summary</CardTitle>
                    <CardDescription>#{order.id} placed on {format(new Date(order.createdAt), "PPP")}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(order.status) as any} className="h-6">
                    {order.status.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Customer</p>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Payment</p>
                      <p className="font-semibold uppercase text-xs">{order.paymentProvider || order.paymentMethod || "-"}</p>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items?.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <p className="font-bold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.storage && `Storage: ${item.storage}`}
                                {item.storage && item.color && " | "}
                                {item.color && `Color: ${item.color}`}
                              </p>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-lg font-bold">Total Amount</p>
                    <p className="text-2xl font-black text-primary">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
