import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  totalPrice: number;
  quantity: number;
  storage: string;
  color: string;
  imageUrl: string;
}

export function CartDrawer() {
  const [, setLocation] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem("cart");
        setCart(savedCart ? JSON.parse(savedCart) : []);
      } catch {
        setCart([]);
      }
    };

    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, []);

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    newCart[index].totalPrice = newCart[index].quantity * newCart[index].price;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("storage"));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = 0; // Default delivery fee
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(price);
  };

  const generateWhatsAppUrl = () => {
    const message = `Hello IFIX, I would like to order the following items:\n\n${cart
      .map(
        (item) =>
          `*${item.name}*\nStorage: ${item.storage}\nColor: ${item.color}\nQuantity: ${item.quantity}\nPrice: ${formatPrice(
            item.totalPrice
          )}\n`
      )
      .join("\n")}\n*Total Amount: ${formatPrice(total)}*\n\nPlease confirm availability. Thank you.`;
    return `https://wa.me/250788442127?text=${encodeURIComponent(message)}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Shopping cart, ${cartCount} items`}
          title="Shopping cart"
          data-testid="button-header-cart"
          className="relative inline-flex items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-gray-700 transition-colors hover:bg-accent/60 hover:text-primary dark:text-gray-200"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="hidden xl:inline">Cart</span>
          {cartCount > 0 && (
            <span
              data-testid="badge-header-cart-count"
              className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between border-b pb-4">
          <SheetTitle className="text-xl font-bold">Your Cart</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => setIsOpen(false)} variant="outline">Start Shopping</Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-6">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-card p-2">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between text-base font-semibold">
                        <h3 className="line-clamp-1">{item.name}</h3>
                        <p className="ml-4">{formatPrice(item.totalPrice)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.storage} • {item.color}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-md border border-border bg-background p-1">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Final price including delivery. Taxes included where applicable.
              </p>
              <div className="grid gap-2">
                <Button 
                  className="w-full py-6 text-lg font-bold"
                  onClick={() => {
                    setIsOpen(false);
                    localStorage.removeItem("checkout_shipping");
                    setLocation("/checkout/shipping");
                  }}
                >
                  Checkout Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setLocation("/cart");
                  }}
                  className="w-full"
                >
                  View Full Cart
                </Button>
                <a 
                  href={generateWhatsAppUrl()} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full"
                >
                  <Button 
                    variant="outline" 
                    className="w-full py-6 text-lg font-bold border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5"
                  >
                    Checkout via WhatsApp
                  </Button>
                </a>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
