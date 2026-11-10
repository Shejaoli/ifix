import { formatSiteCurrency } from "@/lib/site-currency";
import { Fragment, useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  History,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowRight,
  Monitor,
  Star,
  Flame,
  ChevronRight,
  Eye,
  Layers,
  LogOut,
  Bell,
  Search,
  RefreshCw,
  Film,
  Sparkles,
  Tag,
  Truck,
  CalendarDays,
  Copy,
  Download,
  Printer,
  ChevronDown,
  Menu as MenuIcon,
  MoreHorizontal,
  Search as SearchIcon,
  Grid2X2,
  Check,
  X,
  UserRound,
  Plus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminProducts from "./AdminProducts";
import AdminAddProduct from "./AdminAddProduct";
import AdminEditProduct from "./AdminEditProduct";
import AdminOrders from "./AdminOrders";
import AdminAuditLog from "./AdminAuditLog";
import AdminSettings from "./admin/AdminSettings";
import UserManagement from "./admin/UserManagement";
import AdminHomeSections from "./AdminHomeSections";
import AdminReviews from "./AdminReviews";
import AdminHotDeals from "./AdminHotDeals";
import AdminVideos from "./AdminVideos";
import AdminFeaturedSlides from "./AdminFeaturedSlides";
import AdminCoupons from "./AdminCoupons";
import AdminDeliveryFees from "./AdminDeliveryFees";
import AdminCustomers from "./AdminCustomers";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import "./AdminDashboard.css";

const fmt = (value: number) => formatSiteCurrency(Number(value || 0));
const CATEGORY_COLORS = ["#00b2bd", "#6556a5", "#ff0090", "#ffb822", "#38bdf8", "#f97316", "#6556a5"];
const NAV_GROUPS = [
  { id: "Catalog", items: [{ id: "Products", label: "Products", icon: Package }, { id: "Home Sections", label: "Home Sections", icon: Layers }, { id: "Featured Slides", label: "Featured Slides", icon: Sparkles }, { id: "Hot Deals", label: "Today's Top Deals", icon: Flame }, { id: "Videos", label: "Promo Videos", icon: Film }] },
  { id: "Sales", items: [{ id: "Orders", label: "Orders", icon: ShoppingCart }, { id: "Coupons", label: "Coupon Codes", icon: Tag }, { id: "Delivery Fees", label: "Delivery Fees", icon: Truck }] },
  { id: "Customers", items: [{ id: "Customers", label: "Customers", icon: Users }, { id: "Reviews", label: "Reviews", icon: Star }] },
  { id: "Users", items: [{ id: "Users", label: "Users", icon: UserRound }, { id: "Audit Log", label: "Audit Log", icon: History }] },
];
const EDITOR_PRIMARY_TABS = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Orders", label: "Orders", icon: ShoppingCart },
  { id: "Hot Deals", label: "Today's Top Deals", icon: Flame },
  { id: "Videos", label: "Promo Videos", icon: Film },
  { id: "Reviews", label: "Reviews", icon: Star },
];

function StatCard({ title, value, icon: Icon, sub, accent, onClick, trend }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[6px] bg-white p-4 md:p-5 transition-all duration-200 shadow-[0_3px_18px_rgba(72,70,91,0.07)]",
        onClick && "cursor-pointer hover:shadow-[0_8px_24px_rgba(72,70,91,0.12)]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[6px]", accent)}>
          <Icon className="h-4 w-4" />
        </div>
        {typeof trend === "number" && (
          <span className={cn("text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full", trend >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a1a8c3] mb-1">{title}</p>
      <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#242331] truncate">{value}</h3>
      {sub && <p className="text-[10px] text-[#a1a8c3] mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[6px] border border-[#e8eaf3] bg-white px-3 py-2 shadow-xl text-xs">
      <p className="text-[#a1a8c3] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name === "revenue" || p.name === "Sales" ? fmt(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (["paid", "shipped", "completed", "delivered", "confirmed"].includes(normalized)) return "bg-[#e7fbf6] text-[#00858d]";
  if (normalized === "pending") return "bg-[#f1efff] text-[#6556a5]";
  if (normalized === "processing") return "bg-[#fff5df] text-[#c48300]";
  if (["cancelled", "failed", "refunded"].includes(normalized)) return "bg-[#fff0f4] text-[#e64b85]";
  return "bg-[#f0f1f7] text-[#777991]";
};

const statusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (["paid", "shipped", "completed", "delivered", "confirmed"].includes(normalized)) return "#00b2bd";
  if (normalized === "pending") return "#6556a5";
  if (normalized === "processing") return "#ffb822";
  return "#ff0090";
};

function EditorWorkspace({ admin, stats, dash, orders, timeRange, setTimeRange, choosePage, openAddProduct }: any) {
  const rangeLabel = timeRange === "today" ? "Today" : timeRange === "7days" ? "Last 7 days" : timeRange === "30days" ? "Last 30 days" : "All time";
  const orderCount = Number(dash?.totalOrders ?? stats?.totalOrders ?? 0);
  const visitorCount = Number(stats?.totalVisitors || 0);
  const conversion = visitorCount ? (orderCount / visitorCount) * 100 : 0;
  const kpis = [
    { title: "Revenue", value: fmt(stats?.totalRevenue || 0), icon: DollarSign, tint: "bg-violet-50 text-violet-600" },
    { title: "Orders", value: Number(stats?.totalOrders || 0).toLocaleString(), icon: ShoppingCart, tint: "bg-sky-50 text-sky-600" },
    { title: "Needs attention", value: Number(stats?.pendingOrders || 0).toLocaleString(), icon: Clock, tint: "bg-amber-50 text-amber-600" },
    { title: "Store visitors", value: visitorCount.toLocaleString(), icon: Eye, tint: "bg-emerald-50 text-emerald-600" },
  ];
  const salesStatus = dash?.statusGroups || [];
  const sellers = dash?.bestSellers || [];

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-white via-white to-teal-50 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">IFIX · Editor workspace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Welcome{admin?.username ? `, ${admin.username}` : " back"}</h1>
          <p className="mt-1 text-sm text-slate-500">A quick view of store activity and shortcuts for your daily work.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openAddProduct} className="inline-flex h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"><Plus className="h-4 w-4" />Add product</button>
          <button onClick={() => choosePage("Hot Deals")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"><Flame className="h-4 w-4" />Manage deals</button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ title, value, icon: Icon, tint }) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{title}</span><span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tint)}><Icon className="h-4 w-4" /></span></div><strong className="mt-3 block truncate text-xl font-bold text-slate-900">{value}</strong></article>)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2 md:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Sales overview</h2><p className="mt-1 text-xs text-slate-500">Daily revenue and order activity</p></div><DropdownMenu><DropdownMenuTrigger asChild><button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600"><CalendarDays className="h-4 w-4 text-teal-700" />{rangeLabel}<ChevronDown className="h-3.5 w-3.5" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white">{([{ value: "today", label: "Today" }, { value: "7days", label: "Last 7 days" }, { value: "30days", label: "Last 30 days" }, { value: "lifetime", label: "All time" }] as const).map(range => <DropdownMenuItem key={range.value} onSelect={() => setTimeRange(range.value)}>{range.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div>
          <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dash?.chartData || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf1f6" /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={48} /><RechartsTooltip content={<CustomTooltip />} /><Bar dataKey="revenue" name="Sales" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Order status</h2><p className="mt-1 text-xs text-slate-500">Current period · {orderCount} orders</p></div><button onClick={() => choosePage("Orders")} className="text-xs font-semibold text-teal-700 hover:text-teal-800">View orders <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
          <div className="relative mx-auto mt-2 h-[180px] max-w-[230px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={salesStatus} dataKey="count" nameKey="status" innerRadius={54} outerRadius={76} paddingAngle={3} stroke="none">{salesStatus.map((item: any) => <Cell key={item.status} fill={statusColor(item.status)} />)}</Pie><RechartsTooltip formatter={(value: number) => [value + " orders", "Orders"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-slate-900">{orderCount}</strong><span className="text-[10px] text-slate-500">total orders</span></div></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">{salesStatus.map((item: any) => <div key={item.status} className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(item.status) }} />{item.status}<strong className="ml-auto text-slate-800">{item.count}</strong></div>)}</div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-500">Visitor-to-order conversion</span><strong className="float-right text-sm text-slate-900">{conversion.toFixed(2)}%</strong></div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2 md:p-5">
          <div className="mb-3 flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Latest orders</h2><p className="mt-1 text-xs text-slate-500">Recent customer activity</p></div><button onClick={() => choosePage("Orders")} className="text-xs font-semibold text-teal-700">See all</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="py-3">Customer</th><th>Item</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.slice(0, 5).map((order: any) => <tr key={order.id}><td className="py-3 pr-3"><strong className="block font-semibold text-slate-800">{order.customerName}</strong><span className="text-[10px] text-slate-400">{order.customerPhone}</span></td><td className="max-w-[180px] truncate pr-3 text-slate-600">{order.items?.[0]?.name || "Order item"}</td><td className="whitespace-nowrap text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td><td><span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold capitalize", statusClass(order.status))}>{order.status}</span></td><td className="whitespace-nowrap text-right font-semibold text-slate-800">{fmt(order.totalAmount)}</td></tr>)}</tbody></table>{orders.length === 0 && <p className="py-8 text-center text-sm text-slate-400">New orders will appear here.</p>}</div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Popular products</h2><p className="mt-1 text-xs text-slate-500">Top sellers in this period</p></div><button onClick={() => choosePage("Products")} className="text-xs font-semibold text-teal-700">Catalog</button></div>
          <div className="space-y-1">{sellers.slice(0, 5).map((product: any, index: number) => <div key={product.productId} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-slate-800">{product.name}</strong><small className="text-[10px] text-slate-400">{product.category} · {product.units} sold</small></span><strong className="whitespace-nowrap text-[10px] text-slate-700">{fmt(product.sales)}</strong></div>)}{sellers.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Sales data will appear when orders are placed.</p>}</div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[{ label: "Products", icon: Package, page: "Products", tint: "text-teal-700 bg-teal-50" }, { label: "Homepage sections", icon: Layers, page: "Home Sections", tint: "text-violet-600 bg-violet-50" }, { label: "Promo videos", icon: Film, page: "Videos", tint: "text-pink-600 bg-pink-50" }, { label: "Reviews", icon: Star, page: "Reviews", tint: "text-amber-600 bg-amber-50" }].map(({ label, icon: Icon, page, tint }) => <button key={page} onClick={() => choosePage(page)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tint)}><Icon className="h-4 w-4" /></span><span className="text-xs font-semibold text-slate-700">{label}</span><ArrowRight className="ml-auto h-4 w-4 text-slate-300" /></button>)}</section>
    </div>
  );
}

export default function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [subView, setSubView] = useState<"list" | "add" | "edit">("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days" | "lifetime">("30days");
  const [recentSearch, setRecentSearch] = useState("");
  const [recentPage, setRecentPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
        });

        if (!res.ok) {
          navigate("/xifix-portal");
          return;
        }

        setAdminUser(await res.json());

        setCheckingAuth(false);
      } catch {
        navigate("/xifix-portal");
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => { if (wasDark) html.classList.add("dark"); };
  }, []);

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats?timeRange=${timeRange}`);
      return res.json();
    },
  });

  const { data: dash } = useQuery<any>({
    queryKey: ["/api/admin/dashboard", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/dashboard?timeRange=${timeRange}`);
      return res.json();
    },
  });

  const { data: recentOrdersResult } = useQuery<any>({
    queryKey: ["/api/admin/orders", "dashboard-recent", recentSearch, recentPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(recentPage), limit: "6" });
      if (recentSearch.trim()) params.set("search", recentSearch.trim());
      const response = await fetch("/api/admin/orders?" + params, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load recent orders");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: reviewsRes } = useQuery<any>({
    queryKey: ["/api/admin/reviews", "pending-count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reviews?status=pending", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 30000,
  });
  const pendingReviews = reviewsRes?.pendingCount || 0;

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout", {});
    queryClient.clear();
    navigate("/admin/login");
  };

  const statCards = [
    { title: "Revenue", value: fmt(stats?.totalRevenue || 0), icon: DollarSign, accent: "bg-[#f1efff] text-[#6556a5]", trend: stats?.trends?.revenue, onClick: () => choosePage("Orders") },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, accent: "bg-[#fff3e8] text-[#ff8a3d]", trend: stats?.trends?.orders, onClick: () => choosePage("Orders") },
    { title: "Paid Orders", value: stats?.paidOrders || 0, icon: CheckCircle2, accent: "bg-[#e7fbf6] text-[#00b894]", sub: "Paid or fulfilled", onClick: () => choosePage("Orders") },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, accent: "bg-[#fff7df] text-[#ffb822]", trend: stats?.trends?.pending, onClick: () => choosePage("Orders") },
    { title: "Total Visitors", value: stats?.totalVisitors || 0, icon: Eye, accent: "bg-[#eef3ff] text-[#5790ff]", trend: stats?.trends?.visitors },
    { title: "Unique Visitors", value: stats?.uniqueVisitors || 0, icon: Monitor, accent: "bg-[#e7faff] text-[#00b7d8]" },
  ];

  const exportDashboard = () => {
    const rows = [
      ["Date", "Orders", "Sales (RWF)"],
      ...(dash?.chartData || []).map((row: any) => [row.date, row.orders, row.revenue]),
    ];
    const csv = rows.map((row: unknown[]) => row.map((cell: unknown) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ifix-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const copyDashboardSummary = async () => {
    const summary = `IFIX sales report — ${new Date().toLocaleDateString()}\nRevenue: ${fmt(stats?.totalRevenue || 0)}\nOrders: ${stats?.totalOrders || 0}\nPaid orders: ${stats?.paidOrders || 0}`;
    try { await navigator.clipboard.writeText(summary); } catch { /* clipboard may be unavailable on non-secure local pages */ }
  };

  const choosePage = (id: string) => {
    setActiveTab(id);
    setSubView("list");
    setEditId(null);
  };
  const changeOrderStatus = async (order: any, status: string) => {
    try {
      await apiRequest("PATCH", "/api/orders/" + order.id + "/status", { status });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] }),
      ]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Order status could not be updated.");
    }
  };

  const dashboardOrders = recentOrdersResult?.data || [];
  const orderCount = Number(dash?.totalOrders ?? stats?.totalOrders ?? 0);
  const visitorCount = Number(stats?.totalVisitors || 0);
  const conversionRate = visitorCount ? (orderCount / visitorCount) * 100 : 0;
  const currentDateLabel = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date());
  const chartRows = useMemo(() => {
    const current = dash?.chartData || [];
    const previous = dash?.previousChartData || [];
    const previousByDate = new Map(previous.map((row: any) => [row.date, row.revenue]));
    const days = timeRange === "today" ? 1 : timeRange === "7days" ? 7 : 30;
    const currentByDate = new Map(current.map((row: any) => [row.date, row]));
    if (timeRange === "lifetime") return current.map((row: any) => ({ ...row, previousRevenue: 0 }));
    return Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - index - 1));
      const key = date.toISOString().slice(0, 10);
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - days);
      const prevKey = previousDate.toISOString().slice(0, 10);
      return { date: key, revenue: (currentByDate.get(key) as any)?.revenue || 0, orders: (currentByDate.get(key) as any)?.orders || 0, previousRevenue: previousByDate.get(prevKey) || 0 };
    });
  }, [dash?.chartData, dash?.previousChartData, timeRange]);

  const pageOptions = [
    { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...NAV_GROUPS.flatMap(group => group.items),
    { id: "Settings", label: "Settings", icon: Settings },
  ];
  const isEditor = adminUser?.role === "editor";
  const editorMorePages = pageOptions.filter(page => !EDITOR_PRIMARY_TABS.some(tab => tab.id === page.id));
  const channelValues = new Map((dash?.channelSales || []).map((channel: any) => [String(channel.channel).toLowerCase(), Number(channel.orders)]));
  const channelColors: Record<string, string> = { Store: "#6556a5", Instagram: "#ff0090", WhatsApp: "#00b2bd", TikTok: "#242331", Facebook: "#5278d8", Website: "#ffb822" };
  const channelChartData = Object.keys(channelColors).map(channel => {
    const orders = channelValues.get(channel.toLowerCase()) || 0;
    return { channel, orders, percent: orderCount ? Math.round(orders / orderCount * 100) : 0, color: channelColors[channel] };
  });

  if (checkingAuth) {
    return <div className="p-8">Checking authentication...</div>;
  }

  return (
    <div className="admin-dashboard flex min-h-screen flex-col overflow-hidden bg-[#eef4fc] text-[#48465b]">
      {isEditor ? (
      <header className="relative z-30 flex h-[70px] shrink-0 items-center justify-between border-b border-[#e5e8f0] bg-white px-4 shadow-[0_4px_18px_rgba(56,76,112,0.08)] md:px-8">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <a href="/xifix-portal" className="flex shrink-0 items-center gap-2.5" aria-label="IFIX editor home">
            <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-24 object-contain" />
            <span className="leading-tight"><small className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6556a5]">Editor</small></span>
          </a>
          <div className="hidden h-8 w-px bg-[#e7e8f0] sm:block" />
          <div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-bold text-[#242331]">{activeTab === "Hot Deals" ? "Today's Top Deals" : activeTab === "Videos" ? "Promo Videos" : activeTab}</p><p className="text-[10px] text-[#a1a8c3]">IFIX · Editor workspace</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={() => setHeaderSearchOpen(value => !value)} title="Search editor pages" aria-label="Search editor pages" className="admin-icon-tile bg-[#f1efff] text-[#6556a5]"><SearchIcon className="h-[18px] w-[18px]" /></button>
            <button onClick={() => { queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] }); }} title="Refresh dashboard data" aria-label="Refresh dashboard data" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#e3e7f0] bg-white px-3 text-xs font-semibold text-[#656b80] hover:border-[#6556a5] hover:text-[#6556a5]"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-md border border-[#e3e7f0] bg-white px-3 text-xs font-semibold text-[#656b80] hover:border-[#6556a5] hover:text-[#6556a5]">View Store</a>
          </div>
          <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Editor account menu" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#6556a5] text-xs font-bold text-white shadow-sm">ED</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white"><DropdownMenuLabel>{adminUser?.username || "Editor"}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={handleLogout} className="text-rose-600"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <div className="md:hidden"><DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Open editor pages" className="admin-icon-tile h-9 w-9 bg-[#e8faf6] text-[#00b2bd]"><MenuIcon className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-[80vh] overflow-y-auto bg-white"><DropdownMenuLabel>Editor pages</DropdownMenuLabel>{pageOptions.map(page => <DropdownMenuItem key={page.id} onSelect={() => choosePage(page.id)}><page.icon className="h-4 w-4" />{page.label}</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onSelect={handleLogout} className="text-rose-600"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        </div>
        {headerSearchOpen && <div className="absolute left-3 right-3 top-[62px] z-50 rounded-md border border-[#e3e7f0] bg-white p-2 shadow-xl sm:left-[235px] sm:right-auto sm:w-[360px]"><input autoFocus value={headerSearch} onChange={event => setHeaderSearch(event.target.value)} placeholder="Search editor pages..." className="h-10 w-full rounded border border-[#e3e7f0] px-3 text-sm outline-none focus:border-[#6556a5]" />{headerSearch && <div className="mt-1 max-h-56 overflow-y-auto">{pageOptions.filter(page => page.label.toLowerCase().includes(headerSearch.toLowerCase())).map(page => <button key={page.id} onClick={() => { choosePage(page.id); setHeaderSearch(""); setHeaderSearchOpen(false); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[#f5f6fb]"><page.icon className="h-4 w-4 text-[#6556a5]" />{page.label}</button>)}</div>}</div>}
      </header>
      ) : (
      <header className="relative z-30 flex h-[70px] shrink-0 items-center justify-between bg-white px-4 shadow-[0_4px_18px_rgba(56,76,112,0.08)] md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <a href="/xifix-portal" className="flex shrink-0 items-center gap-2.5" aria-label="IFIX admin home">
            <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-24 object-contain" />
            <span className="hidden sm:block leading-tight"><small className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6556a5]">Admin</small></span>
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="hidden h-10 items-center gap-2 rounded border border-[#e3e7f0] px-4 text-xs font-semibold text-[#777991] transition hover:border-[#6556a5] hover:text-[#6556a5] sm:inline-flex"><LayoutDashboard className="h-4 w-4" />{activeTab}<ChevronDown className="h-3.5 w-3.5" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white">
              <DropdownMenuLabel>Quick page switcher</DropdownMenuLabel><DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => choosePage("Dashboard")}>Dashboard</DropdownMenuItem>
              {NAV_GROUPS.map(group => <div key={group.id}><DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[#a1a8c3]">{group.id}</DropdownMenuLabel>{group.items.map(item => <DropdownMenuItem key={item.id} onSelect={() => choosePage(item.id)}><item.icon className="h-4 w-4" />{item.label}</DropdownMenuItem>)}</div>)}
              <DropdownMenuSeparator /><DropdownMenuItem onSelect={() => choosePage("Settings")}><Settings className="h-4 w-4" />Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {headerSearchOpen && <div className="absolute left-3 right-3 top-[62px] z-50 rounded-md border border-[#e3e7f0] bg-white p-2 shadow-xl sm:left-[235px] sm:right-auto sm:w-[360px]"><input autoFocus value={headerSearch} onChange={event => setHeaderSearch(event.target.value)} placeholder="Search admin pages..." className="h-10 w-full rounded border border-[#e3e7f0] px-3 text-sm outline-none focus:border-[#6556a5]" />{headerSearch && <div className="mt-1 max-h-56 overflow-y-auto">{pageOptions.filter(page => page.label.toLowerCase().includes(headerSearch.toLowerCase())).map(page => <button key={page.id} onClick={() => { choosePage(page.id); setHeaderSearch(""); setHeaderSearchOpen(false); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-[#f5f6fb]"><page.icon className="h-4 w-4 text-[#6556a5]" />{page.label}</button>)}</div>}</div>}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button onClick={() => setHeaderSearchOpen(value => !value)} title="Search admin pages" aria-label="Search admin pages" className="admin-icon-tile bg-[#f1efff] text-[#6556a5]"><SearchIcon className="h-[18px] w-[18px]" /></button>
          <button onClick={() => choosePage("Orders")} title="Orders needing attention" aria-label="Orders needing attention" className="admin-icon-tile relative bg-[#e8faf6] text-[#00b2bd]"><Bell className="h-[18px] w-[18px]" />{stats?.pendingOrders > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ff0090]" />}</button>
          <button onClick={() => choosePage("Settings")} title="Settings" aria-label="Settings" className="admin-icon-tile bg-[#fff5df] text-[#ffb822]"><Settings className="h-[18px] w-[18px]" /></button>
          <button onClick={() => choosePage("Orders")} title="Orders" aria-label="Orders" className="admin-icon-tile bg-[#f1efff] text-[#6556a5]"><ShoppingCart className="h-[18px] w-[18px]" /></button>
          <DropdownMenu><DropdownMenuTrigger asChild><button title="All admin pages" aria-label="All admin pages" className="admin-icon-tile bg-[#e8faf6] text-[#00b2bd]"><Grid2X2 className="h-[18px] w-[18px]" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 bg-white"><DropdownMenuLabel>Admin pages</DropdownMenuLabel><DropdownMenuSeparator />{pageOptions.map(page => <DropdownMenuItem key={page.id} onSelect={() => choosePage(page.id)}><page.icon className="h-4 w-4" />{page.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          <button title="English" aria-label="English language" className="admin-icon-tile bg-[#eef3ff] text-[#6556a5]"><span className="text-base">🇬🇧</span></button>
          <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Admin account menu" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#6556a5] text-xs font-bold text-white shadow-sm">{adminUser?.role === "editor" ? "ED" : "AD"}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white"><DropdownMenuLabel>{adminUser?.role === "editor" ? "Editor" : "Administrator"}</DropdownMenuLabel><DropdownMenuItem onSelect={() => choosePage("Audit Log")}><History className="h-4 w-4" />Audit log</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={handleLogout} className="text-rose-600"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button onClick={() => setHeaderSearchOpen(value => !value)} aria-label="Search admin pages" className="admin-icon-tile h-9 w-9 bg-[#f1efff] text-[#6556a5]"><SearchIcon className="h-4 w-4" /></button>
          <DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Open admin menu" className="admin-icon-tile h-9 w-9 bg-[#e8faf6] text-[#00b2bd]"><MenuIcon className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="max-h-[80vh] overflow-y-auto bg-white">{pageOptions.map(page => <DropdownMenuItem key={page.id} onSelect={() => choosePage(page.id)}><page.icon className="h-4 w-4" />{page.label}</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onSelect={handleLogout} className="text-rose-600"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      )}

      {isEditor ? (
      <nav aria-label="Editor sections" className="relative z-20 flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[#e3e7f0] bg-[#e7f3fc] px-3 pt-3 md:px-8">
        {EDITOR_PRIMARY_TABS.map(tab => <button key={tab.id} onClick={() => choosePage(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} className={cn("flex h-12 shrink-0 items-center gap-2 px-4 text-xs font-semibold transition-colors", activeTab === tab.id ? "rounded-t-md border-b-2 border-[#6556a5] bg-white text-[#6556a5]" : "bg-[#deeffb] text-[#737b99] hover:bg-white/70")}><tab.icon className="h-4 w-4" />{tab.label}{tab.id === "Reviews" && pendingReviews > 0 && <span className="rounded-full bg-[#fff3df] px-2 py-0.5 text-[10px] text-[#c48300]">{pendingReviews}</span>}</button>)}
        <DropdownMenu><DropdownMenuTrigger asChild><button aria-current={editorMorePages.some(page => page.id === activeTab) ? "page" : undefined} className={cn("flex h-12 shrink-0 items-center gap-2 px-4 text-xs font-semibold transition-colors", editorMorePages.some(page => page.id === activeTab) ? "rounded-t-md border-b-2 border-[#6556a5] bg-white text-[#6556a5]" : "bg-[#deeffb] text-[#737b99] hover:bg-white/70")}><MoreHorizontal className="h-4 w-4" />More pages<ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto bg-white"><DropdownMenuLabel>Editor pages</DropdownMenuLabel><DropdownMenuSeparator />{editorMorePages.map(page => <DropdownMenuItem key={page.id} onSelect={() => choosePage(page.id)}><page.icon className="h-4 w-4 text-[#6556a5]" />{page.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
      </nav>
      ) : (
      <nav aria-label="Admin sections" className="relative z-20 flex shrink-0 items-center gap-1 overflow-x-auto bg-[#e7f3fc] px-3 pt-3 md:px-8">
        <button onClick={() => choosePage("Dashboard")} aria-current={activeTab === "Dashboard" ? "page" : undefined} className={cn("flex h-12 shrink-0 items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wide transition-colors", activeTab === "Dashboard" ? "rounded-t bg-white text-[#6556a5]" : "bg-[#deeffb] text-[#737b99] hover:bg-white/70")}><LayoutDashboard className="h-4 w-4" />Dashboard</button>
        {NAV_GROUPS.map(group => {
          const active = group.items.some(item => item.id === activeTab);
          const GroupIcon = group.id === "Catalog" ? Package : group.id === "Sales" ? ShoppingCart : group.id === "Customers" ? Users : UserRound;
          return <DropdownMenu key={group.id}><DropdownMenuTrigger asChild><button aria-current={active ? "page" : undefined} className={cn("flex h-12 shrink-0 items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wide transition-colors", active ? "rounded-t bg-white text-[#6556a5]" : "bg-[#deeffb] text-[#737b99] hover:bg-white/70")}><GroupIcon className="h-4 w-4" />{group.id}<ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="bg-white">{group.items.map(item => <DropdownMenuItem key={item.id} onSelect={() => choosePage(item.id)}><item.icon className="h-4 w-4 text-[#6556a5]" />{item.label}{item.id === "Reviews" && pendingReviews > 0 && <span className="ml-auto rounded-full bg-[#fff3df] px-2 text-[10px] text-[#c48300]">{pendingReviews}</span>}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
        })}
        {activeTab === "Settings" && <button className="flex h-12 shrink-0 items-center gap-2 rounded-t bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[#6556a5]"><Settings className="h-4 w-4" />Settings</button>}
      </nav>
      )}

      <main className="relative flex-1 overflow-y-auto px-3 pb-20 pt-0 md:px-8">
        <div className="mx-auto min-h-full max-w-[1600px] bg-white px-3 pb-8 pt-4 shadow-[0_8px_28px_rgba(56,76,112,0.05)] md:px-6 md:pt-5">
          {activeTab === "Products" ? (
            subView === "add" ? <AdminAddProduct onBack={() => setSubView("list")} /> :
            subView === "edit" && editId ? <AdminEditProduct productId={editId} onBack={() => { setSubView("list"); setEditId(null); }} /> :
            <AdminProducts onAddClick={() => { setSubView("add"); setActiveTab("Products"); }} onEditClick={(id) => { setEditId(id); setSubView("edit"); }} />
          ) : activeTab === "Orders" ? <AdminOrders />
          : activeTab === "Reviews" ? <AdminReviews />
          : activeTab === "Hot Deals" ? <AdminHotDeals />
          : activeTab === "Home Sections" ? <AdminHomeSections />
          : activeTab === "Videos" ? <AdminVideos />
          : activeTab === "Featured Slides" ? <AdminFeaturedSlides />
          : activeTab === "Coupons" ? <AdminCoupons />
          : activeTab === "Delivery Fees" ? <AdminDeliveryFees />
          : activeTab === "Customers" ? <AdminCustomers />
          : activeTab === "Users" ? <UserManagement />
          : activeTab === "Settings" ? <AdminSettings />
          : activeTab === "Audit Log" ? <AdminAuditLog />
          : adminUser?.role === "editor" ? <EditorWorkspace admin={adminUser} stats={stats} dash={dash} orders={dashboardOrders} timeRange={timeRange} setTimeRange={setTimeRange} choosePage={choosePage} openAddProduct={() => { setActiveTab("Products"); setSubView("add"); }} />
          : (
            <div className="admin-content space-y-5 md:space-y-6">
              <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#48465b]">Dashboard</h1><span className="hidden h-7 w-px bg-[#e7e8f0] sm:block" /><span className="text-xs text-[#a1a8c3]">IFIX Admin</span>
                  <button onClick={() => { setActiveTab("Products"); setSubView("add"); }} className="inline-flex h-9 items-center gap-2 rounded bg-[#f1efff] px-3 text-xs font-semibold text-[#6556a5] transition hover:bg-[#e8e5ff]"><Plus className="h-4 w-4" />Add Product</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu><DropdownMenuTrigger asChild><button className="inline-flex h-9 items-center gap-2 rounded bg-[#f0f1f7] px-3 text-xs font-medium text-[#777991]"><CalendarDays className="h-4 w-4 text-[#6556a5]" />{timeRange === "today" ? "Today" : timeRange === "7days" ? "Last 7 days" : timeRange === "30days" ? "Last 30 days" : "All time"} · {currentDateLabel}<ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white">{([{ value: "today", label: "Today" }, { value: "7days", label: "Last 7 days" }, { value: "30days", label: "Last 30 days" }, { value: "lifetime", label: "All time" }] as const).map(range => <DropdownMenuItem key={range.value} onSelect={() => setTimeRange(range.value)}>{timeRange === range.value && <Check className="h-4 w-4 text-[#6556a5]" />}{range.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
                  <button onClick={copyDashboardSummary} title="Copy report" aria-label="Copy report" className="admin-icon-tile bg-[#f0f1f7] text-[#8a8da4]"><Copy className="h-4 w-4" /></button>
                  <button onClick={exportDashboard} title="Download CSV" aria-label="Download CSV" className="admin-icon-tile bg-[#f0f1f7] text-[#8a8da4]"><Download className="h-4 w-4" /></button>
                  <button onClick={() => window.print()} title="Print" aria-label="Print" className="admin-icon-tile bg-[#f0f1f7] text-[#8a8da4]"><Printer className="h-4 w-4" /></button>
                  <button onClick={() => choosePage("Settings")} title="Settings" aria-label="Dashboard settings" className="admin-icon-tile bg-[#f0f1f7] text-[#8a8da4]"><Settings className="h-4 w-4" /></button>
                  <button onClick={() => { setActiveTab("Products"); setSubView("add"); }} title="Add product" aria-label="Add product" className="admin-icon-tile bg-[#dffaf3] text-[#00b2bd]"><Plus className="h-4 w-4" /></button>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{statCards.map(card => <StatCard key={card.title} {...card} />)}</div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section className="admin-card"><div className="mb-3"><h2 className="admin-card-title">Daily Sales</h2><p className="admin-card-subtitle">Check out each column for more details</p></div><div className="h-[215px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartRows} barGap="-16" margin={{ top: 12, right: 4, bottom: 0, left: 0 }}><RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "#f7f6ff" }} /><Bar dataKey="previousRevenue" name="Previous period" fill="#efedff" radius={[3, 3, 0, 0]} maxBarSize={18} /><Bar dataKey="revenue" name="Sales" fill="#00b2bd" radius={[3, 3, 0, 0]} maxBarSize={18} /><XAxis dataKey="date" hide /><YAxis hide /></BarChart></ResponsiveContainer></div></section>
                <section className="admin-card"><div className="mb-2"><h2 className="admin-card-title">Sales by Channel</h2><p className="admin-card-subtitle">Orders grouped by where they started</p></div><div className="grid grid-cols-[130px_1fr] items-center gap-2"><div className="relative h-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={channelChartData} dataKey="orders" nameKey="channel" innerRadius={48} outerRadius={69} paddingAngle={3} stroke="none">{channelChartData.map((item: any) => <Cell key={item.channel} fill={item.color} />)}</Pie><RechartsTooltip formatter={(value: number) => [value + " orders", "Orders"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl font-bold text-[#48465b]">{orderCount}</strong><small className="text-[10px] text-[#a1a8c3]">orders</small></div></div><div className="space-y-2">{channelChartData.map((item: any) => <div key={item.channel} className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="flex-1 truncate text-[#777991]">{item.channel}</span><span className="font-semibold text-[#48465b]">{item.percent}%</span></div>)}</div></div></section>
                <section className="admin-card"><div className="mb-2"><h2 className="admin-card-title">Orders by Delivery Zone</h2><p className="admin-card-subtitle">Order volume and revenue movement</p></div><div className="grid grid-cols-[130px_1fr] items-center gap-2"><div className="relative h-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dash?.zoneSales || []} dataKey="orders" nameKey="zone" innerRadius={48} outerRadius={69} paddingAngle={3} stroke="none">{(dash?.zoneSales || []).map((_: any, index: number) => <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}</Pie><RechartsTooltip formatter={(value: number) => [value + " orders", "Orders"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"><strong className="max-w-full truncate text-xs font-bold text-[#48465b]">{dash?.zoneSales?.[0]?.zone || "No zones"}</strong><small className="mt-1 text-[10px] text-[#a1a8c3]">{dash?.zoneSales?.[0]?.orders || 0} orders</small></div></div><div className="space-y-2">{dash?.zoneSales?.length ? dash.zoneSales.slice(0, 5).map((zone: any, index: number) => <div key={zone.zone} className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /><span className="flex-1 truncate text-[#777991]">{zone.zone}</span><span className={cn("font-semibold", zone.change > 0 ? "text-emerald-600" : zone.change < 0 ? "text-rose-500" : "text-[#a1a8c3]")}>{zone.change == null ? "—" : (zone.change > 0 ? "+" : "") + zone.change + "%"}</span></div>) : <p className="text-xs text-[#a1a8c3]">No delivery-zone orders in this period.</p>}</div></div></section>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section className="admin-card min-w-0 xl:col-span-2">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="admin-card-title">Recent Orders</h2><p className="admin-card-subtitle">Latest customer purchases and status</p></div><div className="relative w-full sm:w-64"><SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a8c3]" /><input value={recentSearch} onChange={event => { setRecentSearch(event.target.value); setRecentPage(1); }} placeholder="Search name or phone..." className="h-9 w-full rounded border border-[#e3e7f0] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#6556a5]" /></div></div>
                  <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-xs"><thead className="bg-[#f8f9fc] text-[9px] uppercase tracking-[0.12em] text-[#a1a8c3]"><tr><th className="w-8 px-2 py-3"></th><th className="w-8 px-2 py-3"><input type="checkbox" aria-label="Select all visible orders" onChange={event => setSelectedOrders(event.target.checked ? dashboardOrders.map((order: any) => order.id) : [])} checked={dashboardOrders.length > 0 && dashboardOrders.every((order: any) => selectedOrders.includes(order.id))} /></th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y divide-[#eef0f5]">{dashboardOrders.map((order: any) => { const cancellable = !["cancelled", "failed", "refunded"].includes(order.status); const payable = order.status === "pending" && (order.paymentMethod !== "MTN Mobile Money" || order.paymentState === "SUCCEEDED"); return <Fragment key={order.id}><tr className="transition hover:bg-[#fafbfe]"><td className="px-2 py-3"><button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} aria-label={expandedOrder === order.id ? "Collapse order" : "Expand order"} className="text-[#6556a5]"><ChevronRight className={cn("h-4 w-4 transition-transform", expandedOrder === order.id && "rotate-90")} /></button></td><td className="px-2 py-3"><input type="checkbox" aria-label={"Select order " + order.id} checked={selectedOrders.includes(order.id)} onChange={event => setSelectedOrders(current => event.target.checked ? [...current, order.id] : current.filter(id => id !== order.id))} /></td><td className="px-3 py-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[10px] font-bold text-[#6556a5]">{String(order.customerName || "C").split(/\s+/).map((part: string) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="min-w-0"><strong className="block max-w-[130px] truncate font-semibold text-[#48465b]">{order.customerName}</strong><small className="text-[10px] text-[#a1a8c3]">{order.customerPhone}</small></span></div></td><td className="max-w-[190px] px-3 py-3 text-[#777991]"><span className="line-clamp-2">{order.items?.[0]?.name || "Order item"}{order.items?.length > 1 ? " +" + (order.items.length - 1) + " more" : ""}</span></td><td className="whitespace-nowrap px-3 py-3 text-[#777991]">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td><td className="px-3 py-3"><span className={cn("rounded px-2 py-1 text-[10px] font-bold capitalize", statusClass(order.status))}>{order.status}</span></td><td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-[#48465b]">{fmt(order.totalAmount)}</td><td className="px-3 py-3 text-center"><DropdownMenu><DropdownMenuTrigger asChild><button aria-label="Order actions" className="rounded p-1.5 text-[#8b8da4] hover:bg-[#f0f1f7]"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white"><DropdownMenuItem onSelect={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}><Eye className="h-4 w-4" />View details</DropdownMenuItem><DropdownMenuItem disabled={!payable} onSelect={() => changeOrderStatus(order, "paid")}><Check className="h-4 w-4" />Mark as paid</DropdownMenuItem><DropdownMenuItem disabled={!cancellable} onSelect={() => changeOrderStatus(order, "cancelled")} className="text-rose-600"><X className="h-4 w-4" />Cancel order</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>{expandedOrder === order.id && <tr className="bg-[#fafbfe]"><td colSpan={8} className="px-10 py-3 text-xs text-[#777991]"><div className="flex flex-wrap gap-x-6 gap-y-2"><span>Tracking: <strong>{order.trackingCode || "Not assigned"}</strong></span><span>Payment: <strong>{order.paymentMethod || "Not specified"}</strong></span><span>Delivery: <strong>{order.deliveryDistrict || order.deliveryLocation || order.orderType || "Not specified"}</strong></span><span>Items: <strong>{order.items?.map((item: any) => item.name + " × " + item.quantity).join(", ")}</strong></span></div></td></tr>}</Fragment>; })}</tbody></table></div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-[#a1a8c3]"><span>{recentOrdersResult?.total || 0} matching orders</span><div className="flex items-center gap-2"><button disabled={recentPage <= 1} onClick={() => setRecentPage(page => Math.max(1, page - 1))} className="rounded border border-[#e5e7ef] px-3 py-1.5 disabled:opacity-40">Previous</button><span>{recentPage} / {Math.max(1, recentOrdersResult?.totalPages || 1)}</span><button disabled={recentPage >= (recentOrdersResult?.totalPages || 1)} onClick={() => setRecentPage(page => page + 1)} className="rounded border border-[#e5e7ef] px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
                </section>
                <section className="admin-card flex flex-col">
                  <div className="flex items-start justify-between"><div><h2 className="admin-card-title">Visitors → Orders</h2><p className="admin-card-subtitle">Orders in selected period</p></div><DropdownMenu><DropdownMenuTrigger asChild><button className="rounded bg-[#e7fbf6] px-3 py-2 text-[10px] font-semibold text-[#00858d]">Export <ChevronDown className="ml-1 inline h-3 w-3" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-white"><DropdownMenuItem onSelect={exportDashboard}><Download className="h-4 w-4" />Download CSV</DropdownMenuItem><DropdownMenuItem onSelect={() => window.print()}><Printer className="h-4 w-4" />Print report</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
                  <strong className="mt-5 text-3xl font-extrabold text-[#6556a5]">{orderCount.toLocaleString()}</strong><p className="mt-1 text-xs text-[#a1a8c3]">Orders in selected period</p><p className="mt-4 rounded bg-[#f6f5ff] px-3 py-2 text-xs text-[#777991]">Conversion <strong className="text-[#48465b]">{conversionRate.toFixed(2)}%</strong> <span className="text-[#a1a8c3]">of {visitorCount.toLocaleString()} visitors</span></p>
                  <div className="mt-auto h-[105px] pt-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows}><defs><linearGradient id="ordersSpark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00b2bd" stopOpacity={0.28} /><stop offset="100%" stopColor="#00b2bd" stopOpacity={0.02} /></linearGradient></defs><Area dataKey="orders" type="monotone" stroke="#00b2bd" strokeWidth={2} fill="url(#ordersSpark)" dot={false} /></AreaChart></ResponsiveContainer></div>
                </section>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <section className="admin-card xl:col-span-2"><div className="mb-3"><h2 className="admin-card-title">Best-Selling Products</h2><p className="admin-card-subtitle">Ranked by units sold in the selected period</p></div><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-xs"><thead className="text-[9px] uppercase tracking-widest text-[#a1a8c3]"><tr><th className="py-2 text-left">Product</th><th className="py-2 text-left">Category</th><th className="py-2 text-right">Units</th><th className="py-2 text-right">Sales</th></tr></thead><tbody className="divide-y divide-[#eef0f5]">{(dash?.bestSellers || []).slice(0, 6).map((product: any, index: number) => <tr key={product.productId}><td className="py-3 pr-3"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded bg-[#f1efff] text-[10px] font-bold text-[#6556a5]">{index + 1}</span><strong className="font-semibold text-[#48465b]">{product.name}</strong></td><td className="py-3 text-[#777991]">{product.category}</td><td className="py-3 text-right">{product.units}</td><td className="py-3 text-right font-semibold text-[#48465b]">{fmt(product.sales)}</td></tr>)}</tbody></table>{!dash?.bestSellers?.length && <p className="py-6 text-center text-xs text-[#a1a8c3]">Product sales will appear here when orders are placed.</p>}</div></section>
                <section className="admin-card"><div className="mb-2"><h2 className="admin-card-title">Order Status</h2><p className="admin-card-subtitle">Current order distribution</p></div><div className="relative h-40"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dash?.statusGroups || []} dataKey="count" nameKey="status" innerRadius={43} outerRadius={63} paddingAngle={3} stroke="none">{(dash?.statusGroups || []).map((item: any) => <Cell key={item.status} fill={statusColor(item.status)} />)}</Pie><RechartsTooltip formatter={(value: number) => [value + " orders", "Orders"]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><strong className="text-xl text-[#48465b]">{orderCount}</strong></div></div><div className="mt-1 grid grid-cols-2 gap-2">{(dash?.statusGroups || []).map((item: any) => <div key={item.status} className="flex items-center gap-1.5 text-[10px] text-[#777991]"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(item.status) }} />{item.status}<strong className="ml-auto text-[#48465b]">{item.count}</strong></div>)}</div></section>
                <section className="admin-card"><div className="mb-3"><h2 className="admin-card-title">Revenue by Category</h2><p className="admin-card-subtitle">Sales breakdown for selected dates</p></div>{dash?.categorySales?.length ? <div className="space-y-4">{dash.categorySales.slice(0, 7).map((category: any, index: number) => { const max = Math.max(...dash.categorySales.map((entry: any) => entry.sales), 1); return <div key={category.category}><div className="mb-1 flex items-center justify-between gap-2 text-[10px]"><span className="truncate text-[#777991]">{category.category}</span><strong className="shrink-0 text-[#48465b]">{fmt(category.sales)}</strong></div><div className="h-2 rounded-full bg-[#f0eff8]"><div className="h-full rounded-full" style={{ width: Math.max(3, category.sales / max * 100) + "%", backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /></div></div>})}</div> : <p className="py-8 text-center text-xs text-[#a1a8c3]">No product sales for this period.</p>}</section>
                <section className="admin-card"><div className="mb-3 flex items-center justify-between"><div><h2 className="admin-card-title">Inventory</h2><p className="admin-card-subtitle">Low stock and unavailable items</p></div><button onClick={() => choosePage("Products")} className="text-[10px] font-semibold text-[#6556a5]">Edit <ArrowRight className="ml-1 inline h-3 w-3" /></button></div>{stats?.lowStockProducts?.length ? <div className="space-y-3">{stats.lowStockProducts.slice(0, 5).map((product: any) => <div key={product.id} className="flex items-center justify-between gap-3 border-b border-[#f0f1f5] pb-2 last:border-0"><span className="min-w-0 truncate text-xs font-semibold text-[#48465b]">{product.name}</span><span className={cn("shrink-0 rounded px-2 py-1 text-[10px] font-bold", product.stock === 0 ? "bg-[#fff0f2] text-[#e4566b]" : "bg-[#fff7df] text-[#c48300]")}>{product.stock === 0 ? "Out of stock" : product.stock + " left"}</span></div>)}</div> : <div className="rounded bg-[#e9faf4] p-3 text-xs text-[#00858d]"><CheckCircle2 className="mr-1 inline h-4 w-4" />All in stock</div>}</section>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 rounded-l-lg bg-white p-2 shadow-[0_4px_24px_rgba(55,72,110,0.16)] md:flex">
        {[{ label: "Manage Products", icon: Package, action: () => choosePage("Products"), tint: "bg-[#f1efff] text-[#6556a5]" }, { label: "Process Orders", icon: ShoppingCart, action: () => choosePage("Orders"), tint: "bg-[#e8faf6] text-[#00b2bd]" }, { label: "Review Pending", icon: Star, action: () => choosePage("Reviews"), tint: "bg-[#fff5df] text-[#ffb822]" }, { label: "Edit Homepage", icon: Layers, action: () => choosePage("Home Sections"), tint: "bg-[#fff0f7] text-[#ff0090]" }].map(tool => <button key={tool.label} title={tool.label} onClick={tool.action} className={cn("admin-icon-tile group relative", tool.tint)}><tool.icon className="h-4 w-4" /><span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-[#48465b] px-2 py-1 text-[10px] text-white opacity-0 shadow transition group-hover:opacity-100">{tool.label}</span></button>)}
      </div>
    </div>
  );
}

