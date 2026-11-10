import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus, Trash2, Shield, UserCog, Mail, User, ShieldAlert } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

export default function UserManagement() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const { data: me } = useQuery<any>({ queryKey: ["/api/admin/me"] });

  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      role: "staff"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Creation failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isSuperAdmin = me?.role === "admin";

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">Only super administrators can manage team accounts and permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase mb-2">Team Management</h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">Control administrative access and manage team roles across the platform.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8">
        <Card className="xl:col-span-1 border-none shadow-xl bg-card/50 backdrop-blur sticky top-0 xl:top-8 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
              <UserPlus className="h-5 w-5 text-primary" /> Onboard User
            </CardTitle>
            <CardDescription>Add a new member to your administrative team.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-10 h-11" {...form.register("email")} placeholder="name@company.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="username" className="pl-10 h-11" {...form.register("username")} placeholder="johndoe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initial Password</Label>
                <Input id="password" type="password" className="h-11" {...form.register("password")} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Role</Label>
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Assign a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Super Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="sales">Sales Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="staff">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-none shadow-xl bg-card/50 backdrop-blur overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-black uppercase tracking-tight">
              <UserCog className="h-5 w-5 text-primary" /> Active Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 h-12">User Identity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Role & Access</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-12">Security</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-6 h-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="group border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm leading-none">{user.username || "Unnamed User"}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.twoFactorEnabled ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                          {user.twoFactorEnabled ? "2FA Active" : "No 2FA"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.id !== me?.id && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                            onClick={() => {
                              if (confirm("Permanently revoke access for this user?")) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
