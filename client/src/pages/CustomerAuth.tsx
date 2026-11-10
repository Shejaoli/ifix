import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User, Mail, Phone, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Navbar } from "@/components/Navbar";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function CustomerAuth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: me, isLoading: checkingAuth } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  if (!checkingAuth && me) {
    navigate("/account/profile");
    return null;
  }

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/customers/login", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({ title: "Welcome back!", description: "You are now logged in." });
      navigate("/account/profile");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Login failed", description: err.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/customers/register", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      toast({ title: "Account created!", description: "Welcome to IFIX." });
      navigate("/account/profile");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    },
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background flex items-start justify-center pt-10 px-4 pb-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">IFIX</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to manage your orders and account</p>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab("login")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${tab === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setTab("register")}
              >
                Create Account
              </button>
            </div>

            <div className="p-6">
              {tab === "login" ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type="email" placeholder="you@example.com" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showPass ? "text" : "password"}
                                placeholder="Your password"
                                className="pl-9 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Sign In
                    </Button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">or</span>
                      </div>
                    </div>

                    <a
                      href="/auth/google"
                      className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-md border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 shadow-sm"
                    >
                      <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                      Continue with Google
                    </a>

                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setTab("register")} className="text-primary font-medium hover:underline">
                        Create one
                      </button>
                    </p>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(d => registerMutation.mutate(d))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input placeholder="Jean Claude Uwimana" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type="email" placeholder="you@example.com" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
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
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showPass ? "text" : "password"}
                                placeholder="At least 8 characters"
                                className="pl-9 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat your password"
                                className="pl-9 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Account
                    </Button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">or</span>
                      </div>
                    </div>

                    <a
                      href="/auth/google"
                      className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-md border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 shadow-sm"
                    >
                      <SiGoogle className="w-4 h-4 text-[#4285F4]" />
                      Continue with Google
                    </a>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setTab("login")} className="text-primary font-medium hover:underline">
                        Sign in
                      </button>
                    </p>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
