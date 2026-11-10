import { formatSiteCurrency, getSiteCurrency } from "@/lib/site-currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminAnalytics() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats", "30days"],
  });

  const chartData = stats?.monthlyAnalytics?.map((item: any) => {
    const [year, month] = item.period.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
    return {
      name: monthName,
      sales: item.revenue,
      users: item.orders
    };
  }) || [
    { name: 'Jan', sales: 0, users: 0 },
    { name: 'Feb', sales: 0, users: 0 },
    { name: 'Mar', sales: 0, users: 0 },
    { name: 'Apr', sales: 0, users: 0 },
    { name: 'May', sales: 0, users: 0 },
    { name: 'Jun', sales: 0, users: 0 },
  ];

  const formatRWF = formatSiteCurrency;

  const statsCards = [
    { title: "Total Revenue", value: stats?.totalRevenue ? formatRWF(stats.totalRevenue) : formatRWF(0), trend: "+0%", icon: DollarSign, color: "text-primary" },
    { title: "Total Visitors", value: stats?.totalVisitors || 0, trend: "+0%", icon: Monitor, color: "text-teal-600" },
    { title: "Unique Visitors", value: stats?.uniqueVisitors || 0, trend: "+0%", icon: Smartphone, color: "text-green-500" },
    { title: "Registered Users", value: stats?.totalAdmins || 0, trend: "+0%", icon: Settings, color: "text-amber-500" }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Analytics Overview</h1>
          <p className="text-muted-foreground">Detailed performance metrics for your business.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-md bg-card/50 backdrop-blur hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-black">{stat.value}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-green-500">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Revenue Growth ({getSiteCurrency().currency})</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} tickFormatter={(value) => `FRw${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatRWF(value), "Revenue"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Orders Count</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                  formatter={(value: number) => [value, "Orders"]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
