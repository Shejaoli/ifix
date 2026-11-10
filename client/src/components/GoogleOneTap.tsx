import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            nonce: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_ID = "google-identity-services";

/** Shows Google's own One Tap prompt on public storefront pages. */
export function GoogleOneTap() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const showPrompt = async () => {
      if (cancelled) return;

      try {
        const sessionResponse = await fetch("/api/customer/me", { credentials: "include" });
        if (sessionResponse.ok || cancelled) return;

        const configResponse = await fetch("/api/auth/google/config", { credentials: "include", cache: "no-store" });
        if (!configResponse.ok || cancelled) return;
        const { clientId, nonce } = await configResponse.json();
        if (!clientId || !nonce || cancelled) return;

        const initialize = () => {
          const googleId = window.google?.accounts?.id;
          if (cancelled || !googleId) return;

          googleId.initialize({
            client_id: clientId,
            nonce,
            auto_select: false,
            callback: async ({ credential }) => {
              if (!credential || cancelled) return;
              try {
                const response = await fetch("/api/customer/google-one-tap", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ credential }),
                });
                if (!response.ok) throw new Error("Google sign-in could not be completed. Please try again.");

                const result = await response.json();
                queryClient.setQueryData(["/api/customer/me"], result.customer);
                await queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
                toast({
                  title: result.isNewCustomer ? "Welcome to IFIX" : "Signed in successfully",
                  description: result.isNewCustomer ? "Your customer account is ready." : "You’re signed in to your account.",
                });
              } catch (error) {
                toast({
                  title: "Google sign-in failed",
                  description: error instanceof Error ? error.message : "Please try again.",
                  variant: "destructive",
                });
              }
            },
          });
          googleId.prompt();
        };

        if (window.google?.accounts?.id) {
          initialize();
          return;
        }

        script = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = GIS_SCRIPT_ID;
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.addEventListener("load", initialize, { once: true });
          document.head.appendChild(script);
        } else {
          script.addEventListener("load", initialize, { once: true });
        }
      } catch {
        // One Tap is optional; keep the storefront usable if Google is blocked.
      }
    };

    if (!location.startsWith("/admin") && location !== "/xifix-portal") {
      void showPrompt();
    } else {
      window.google?.accounts?.id?.cancel();
    }

    return () => {
      cancelled = true;
      // The script load callback owns the initialization closure; removing the
      // script itself is unnecessary and can disrupt other mounted routes.
    };
  }, [location, queryClient, toast]);

  return null;
}
