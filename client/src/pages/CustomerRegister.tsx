import { useState, forwardRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(9, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof registerSchema>;

const GlassInput = forwardRef<HTMLInputElement, {
  type?: string;
  placeholder: string;
  autoComplete?: string;
  error?: string;
  suffix?: React.ReactNode;
  testId?: string;
  [key: string]: any;
}>(({ type = "text", placeholder, autoComplete, error, suffix, testId, ...props }, ref) => (
  <div>
    <div className="relative">
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-testid={testId}
        {...props}
        className="w-full h-12 rounded-full px-5 pr-12 text-sm outline-none transition-all
          bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400
          focus:border-primary focus:ring-2 focus:ring-primary/20
          dark:bg-white/[0.08] dark:border-white/[0.15] dark:text-white dark:placeholder:text-white/45
          dark:focus:ring-primary/30"
        style={error ? { borderColor: "hsl(var(--destructive))" } : {}}
      />
      {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
    {error && <p className="text-xs text-red-500 mt-1 pl-4">{error}</p>}
  </div>
));

export default function CustomerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterForm, "confirmPassword">) =>
      apiRequest("POST", "/api/customer/register", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      toast({ title: "Account created!", description: "Welcome to IFIX." });
      navigate(redirectTo);
    },
    onError: (err: any) => {
      const msg = err?.message || "Registration failed. Please try again.";
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword: _, ...payload } = data;
    registerMutation.mutate(payload);
  };

  const e = form.formState.errors;

  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle}
      className="transition-colors text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80">
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <>
      <Helmet>
        <title>Create Account | IFIX</title>
      </Helmet>

      {/* Full-screen background — electronics photo with overlay */}
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
        style={{ backgroundImage: "url('/images/auth-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>

        {/* Overlay — lighter in light mode, darker in dark mode */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/65 backdrop-blur-[2px]" />

        {/* Glass card */}
        <div className="relative w-full max-w-sm rounded-3xl p-8 z-10 backdrop-blur-2xl
          bg-white/80 border border-gray-200 shadow-2xl
          dark:bg-white/[0.06] dark:border-white/[0.12] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)]">

          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-7">
            <Link href="/">
              <img src="/ifix-logo.png" alt="IFIX Technology" width={445} height={245} className="h-auto w-40 object-contain mb-3"
                onError={(e) => (e.currentTarget.style.display = "none")} />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-sm mt-1 text-gray-500 dark:text-white/50">Join IFIX today</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <GlassInput placeholder="Full Name" testId="input-fullname" autoComplete="name"
              error={e.fullName?.message} {...form.register("fullName")} />
            <GlassInput type="email" placeholder="Email" testId="input-email" autoComplete="email"
              error={e.email?.message} {...form.register("email")} />
            <GlassInput type="tel" placeholder="Phone Number" testId="input-phone" autoComplete="tel"
              error={e.phone?.message} {...form.register("phone")} />
            <GlassInput
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              testId="input-password"
              autoComplete="new-password"
              error={e.password?.message}
              suffix={eyeBtn(showPassword, () => setShowPassword(!showPassword))}
              {...form.register("password")}
            />
            <GlassInput
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              testId="input-confirm-password"
              autoComplete="new-password"
              error={e.confirmPassword?.message}
              suffix={eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
              {...form.register("confirmPassword")}
            />

            <div className="pt-1">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                data-testid="button-submit"
                className="w-full h-12 rounded-full font-bold uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : "CREATE ACCOUNT"}
              </button>
            </div>
          </form>

          {/* Sign in link */}
          <div className="flex items-center justify-center mt-5 text-xs">
            <span className="text-gray-400 dark:text-white/45">Already have an account?{" "}
              <Link
                href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="font-semibold text-gray-700 hover:text-primary dark:text-white/70 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.12]" />
            <span className="text-xs uppercase tracking-widest text-gray-400 dark:text-white/35">or sign up with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.12]" />
          </div>

          {/* Google button */}
          <div className="flex justify-center">
            <a
              href={`/auth/google?redirect=${encodeURIComponent(redirectTo)}`}
              className="flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 active:scale-95
                bg-gray-50 border border-gray-200 shadow-sm
                dark:bg-white/[0.10] dark:border-white/[0.18]"
              title="Sign up with Google"
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
