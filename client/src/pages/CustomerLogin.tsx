import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function CustomerLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiRequest("POST", "/api/customer/login", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      toast({ title: "Welcome back!", description: "You are now logged in." });
      navigate(redirectTo);
    },
    onError: (err: any) => {
      const msg = err?.message || "Invalid email or password.";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    },
  });

  const errors = form.formState.errors;

  return (
    <>
      <Helmet>
        <title>Sign In | IFIX</title>
      </Helmet>

      {/* Full-screen background — electronics photo with overlay */}
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ backgroundImage: "url('/images/auth-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

        {/* Overlay — lighter in light mode, darker in dark mode */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/65 backdrop-blur-[2px]" />

        {/* Glass card */}
        <div className="relative w-full max-w-sm rounded-3xl p-8 z-10 backdrop-blur-2xl
          bg-white/80 border border-gray-200 shadow-2xl
          dark:bg-white/[0.06] dark:border-white/[0.12] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)]">

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/">
              <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-40 object-contain mb-3"
                onError={(e) => (e.currentTarget.style.display = "none")} />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm mt-1 text-gray-500 dark:text-white/50">Sign in to your IFIX account</p>
          </div>

          <form onSubmit={form.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                data-testid="input-email"
                {...form.register("email")}
                className="w-full h-12 rounded-full px-5 text-sm outline-none transition-all
                  bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  dark:bg-white/[0.08] dark:border-white/[0.15] dark:text-white dark:placeholder:text-white/45
                  dark:focus:ring-primary/30"
                style={errors.email ? { borderColor: "hsl(var(--destructive))" } : {}}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 pl-4">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  data-testid="input-password"
                  {...form.register("password")}
                  className="w-full h-12 rounded-full px-5 pr-12 text-sm outline-none transition-all
                    bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400
                    focus:border-primary focus:ring-2 focus:ring-primary/20
                    dark:bg-white/[0.08] dark:border-white/[0.15] dark:text-white dark:placeholder:text-white/45
                    dark:focus:ring-primary/30"
                  style={errors.password ? { borderColor: "hsl(var(--destructive))" } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1 pl-4">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              data-testid="button-submit"
              className="w-full h-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
              ) : "LOGIN"}
            </button>
          </form>

          {/* Links row */}
          <div className="flex items-center justify-between mt-5 text-xs">
            <span className="text-gray-400 dark:text-white/45">Forgot Password?</span>
            <Link
              href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="font-semibold text-gray-600 hover:text-primary dark:text-white/60 dark:hover:text-white transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.12]" />
            <span className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/35">or login with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.12]" />
          </div>

          {/* Google button */}
          <div className="flex justify-center">
            <a
              href={`/auth/google?redirect=${encodeURIComponent(redirectTo)}`}
              className="flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95
                bg-gray-50 border border-gray-200 shadow-sm
                dark:bg-white/[0.10] dark:border-white/[0.18]"
              title="Continue with Google"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
