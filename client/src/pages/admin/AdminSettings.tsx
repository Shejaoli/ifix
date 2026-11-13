import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ShieldCheck, User, KeyRound, Mail, Fingerprint, Bell, RefreshCw, Database, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SUPPORTED_CURRENCIES, type SiteCurrency } from "@/lib/site-currency";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function NotificationsCard() {
  const { toast } = useToast();
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSupported(false);
        setChecking(false);
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        setSubscribed(!!existing);
      } catch (error) {
        console.error("Push support check failed:", error);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ title: "Notifications blocked", description: "Enable notifications for this site in your browser settings.", variant: "destructive" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const keyRes = await apiRequest("GET", "/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await apiRequest("POST", "/api/admin/push-subscribe", subscription.toJSON());
      setSubscribed(true);
      toast({ title: "Push notifications enabled" });
    } catch (error: any) {
      toast({ title: "Could not enable notifications", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiRequest("POST", "/api/admin/push-unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast({ title: "Push notifications disabled" });
    } catch (error: any) {
      toast({ title: "Could not disable notifications", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
          <Bell className="h-5 w-5 text-primary" /> Notifications
        </CardTitle>
        <CardDescription>Get alerted on new orders and new customer sign-ups.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
          <div className="space-y-1">
            <Label className="text-sm font-bold">Browser Push Alerts</Label>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {!supported ? "Not supported on this browser" : checking ? "Checking status..." : subscribed ? "Enabled on this device" : "Disabled on this device"}
            </p>
          </div>
          <Button
            type="button"
            variant={subscribed ? "outline" : "default"}
            className="font-bold uppercase tracking-widest border-2"
            disabled={!supported || checking || busy}
            onClick={subscribed ? disable : enable}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {subscribed ? "Disable" : "Enable"}
          </Button>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground italic leading-relaxed">
          New order and new customer emails go to every address listed under Admins, regardless of this setting.
        </p>
      </CardContent>
    </Card>
  );
}

function CurrencySettingsCard() {
  const { toast } = useToast();
  const { data } = useQuery<SiteCurrency>({ queryKey: ["/api/site-currency"] });
  const [currency, setCurrency] = useState("RWF");
  const [rate, setRate] = useState("1");

  useEffect(() => {
    if (data) { setCurrency(data.currency); setRate(data.rwfPerUnit); }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/admin/site-currency", { currency, rwfPerUnit: Number(rate) });
      return response.json();
    },
    onSuccess: (updated: SiteCurrency) => {
      queryClient.setQueryData(["/api/site-currency"], updated);
      toast({ title: "Store currency updated", description: `All displayed prices now use ${updated.currency}.` });
    },
    onError: (error: Error) => toast({ title: "Currency update failed", description: error.message, variant: "destructive" }),
  });

  return <Card className="border-none shadow-xl bg-card/50 backdrop-blur md:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight"><RefreshCw className="h-5 w-5 text-primary" /> Store display currency</CardTitle>
      <CardDescription>Convert displayed prices across the storefront with one setting. Product prices and checkout records remain stored in RWF.</CardDescription>
    </CardHeader>
    <CardContent>
      <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
        <div className="space-y-2">
          <Label htmlFor="display-currency">Show prices in</Label>
          <select id="display-currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            {SUPPORTED_CURRENCIES.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rwf-per-unit">RWF per 1 {currency}</Label>
          <Input id="rwf-per-unit" type="number" min="0.000001" step="any" required value={rate} onChange={(event) => setRate(event.target.value)} disabled={currency === "RWF"} />
        </div>
        <Button type="submit" className="h-11 font-bold" disabled={saveMutation.isPending || !Number.isFinite(Number(rate)) || Number(rate) <= 0}>
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Apply to whole site
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Example: choose USD and enter 1,500 if 1 USD = 1,500 RWF. A 3,000,000 RWF price will display as about $2,000. This is a display conversion only.</p>
    </CardContent>
  </Card>;
}

const RESET_GROUPS = [
  { id: "orders", title: "Orders", detail: "Remove all order records." },
  { id: "products", title: "Products", detail: "Remove all products and saved wishlists." },
  { id: "customers", title: "Customers", detail: "Remove customer accounts and saved wishlists." },
  { id: "coupons", title: "Coupons", detail: "Remove coupon codes and usage records." },
  { id: "videos", title: "Promo videos", detail: "Remove promo video records and uploaded video files." },
  { id: "homepage", title: "Homepage content", detail: "Remove homepage sections and featured slides." },
  { id: "reviews", title: "Reviews", detail: "Remove product reviews and ratings." },
  { id: "analytics", title: "Analytics logs", detail: "Clear visitor and broken-link tracking data." },
] as const;

type ResetGroupId = typeof RESET_GROUPS[number]["id"];

function AdminDataResetCard({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { toast } = useToast();
  const [sections, setSections] = useState<ResetGroupId[]>([]);
  const [confirmation, setConfirmation] = useState("");
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/data-reset", { sections, confirmation: confirmation.trim() });
      return response.json();
    },
    onSuccess: (result) => {
      const total = Object.values(result.deleted as Record<string, number>).reduce((sum, count) => sum + count, 0);
      toast({ title: "Selected data reset complete", description: `${total} records removed. Admin accounts and audit history were preserved.` });
      setSections([]);
      setConfirmation("");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast({ title: "Data reset failed", description: error.message, variant: "destructive" }),
  });

  if (!isSuperAdmin) return null;

  const toggle = (id: ResetGroupId, checked: boolean) => setSections((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const canReset = sections.length > 0 && confirmation.trim() === "RESET IFIX DATA" && !resetMutation.isPending;

  return <Card className="border border-destructive/20 shadow-xl bg-card/70 backdrop-blur md:col-span-2">
    <CardHeader className="bg-destructive/[0.045] border-b border-destructive/10">
      <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-destructive"><Database className="h-5 w-5" /> Reset selected admin data</CardTitle>
      <CardDescription>Choose exactly which data group to clear. Each selection is processed separately so you do not have to wipe everything.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5 pt-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {RESET_GROUPS.map((group) => <label key={group.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-destructive/30">
          <Checkbox checked={sections.includes(group.id)} onCheckedChange={(checked) => toggle(group.id, checked === true)} />
          <span><span className="block text-sm font-bold">{group.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{group.detail}</span></span>
        </label>)}
      </div>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300"><AlertTriangle className="h-4 w-4" />Protected action</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Only the main admin account can run this. Admin accounts and audit history are never cleared. This action permanently deletes the selected records.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2"><Label htmlFor="reset-confirmation">Type RESET IFIX DATA to unlock the reset button</Label><Input id="reset-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} placeholder="RESET IFIX DATA" /></div>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button type="button" variant="destructive" className="h-11" disabled={!canReset}><Database className="mr-2 h-4 w-4" />Review reset</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm selected data reset</AlertDialogTitle><AlertDialogDescription>This will permanently clear: {sections.map((id) => RESET_GROUPS.find((group) => group.id === id)?.title).filter(Boolean).join(", ")}. Admin login accounts and audit history will remain.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Go back</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>{resetMutation.isPending ? "Resetting…" : "Reset selected data"}</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>;
}

const accountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: me, isLoading } = useQuery<any>({ queryKey: ["/api/admin/me"] });

  const accountForm = useForm({
    values: {
      username: me?.username || "",
      email: me?.email || "",
    }
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/admin/account", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const updateProfile = (data: any) => {
    updateMutation.mutate({ username: data.username });
  };

  const updatePassword = (data: any) => {
    updateMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Account & Security</h1>
        <p className="text-muted-foreground font-medium">Manage your administrative profile and security preferences.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CurrencySettingsCard />
        <AdminDataResetCard isSuperAdmin={me?.role === "admin"} />
        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                <User className="h-5 w-5 text-primary" /> Profile Settings
              </CardTitle>
              <CardDescription>Update your public administrative identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={accountForm.handleSubmit(updateProfile)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="username" className="pl-10 h-11" {...accountForm.register("username")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input value={me?.email} disabled className="pl-10 h-11 bg-muted/50 cursor-not-allowed" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                <Fingerprint className="h-5 w-5 text-primary" /> Multi-Factor Auth
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">2FA Protection</Label>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {me?.twoFactorEnabled ? "Security is active" : "Account is less secure"}
                  </p>
                </div>
                <Switch 
                  checked={me?.twoFactorEnabled} 
                  onCheckedChange={(checked) => updateMutation.mutate({ twoFactorEnabled: checked })}
                  disabled={updateMutation.isPending}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground italic leading-relaxed">
                When enabled, you'll be required to provide a security code from your authenticator app during login.
              </p>
            </CardContent>
          </Card>

          <NotificationsCard />
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
              <KeyRound className="h-5 w-5 text-primary" /> Password Security
            </CardTitle>
            <CardDescription>Keep your account secure with a strong password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Current Password</Label>
                <Input id="currentPassword" type="password" className="h-11" {...passwordForm.register("currentPassword")} placeholder="••••••••" />
              </div>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground">New Password</Label>
                  <Input id="newPassword" type="password" className="h-11" {...passwordForm.register("newPassword")} placeholder="Min. 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="h-11" {...passwordForm.register("confirmPassword")} placeholder="Repeat password" />
                </div>
              </div>
              <Button type="submit" variant="secondary" className="w-full h-11 font-bold uppercase tracking-widest border-2" disabled={updateMutation.isPending}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 p-6 rounded-2xl border border-dashed border-border/50">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Account History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Member Since</span>
            <span className="text-sm font-medium">{new Date(me?.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Last Activity</span>
            <span className="text-sm font-medium">{me?.lastLogin ? new Date(me.lastLogin).toLocaleString() : "First session"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
