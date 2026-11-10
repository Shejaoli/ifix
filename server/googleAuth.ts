import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, Request, Response } from "express";
import { storage } from "./storage";

function getBaseUrl(req?: Request): string {
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0].trim();
    return `https://${domain}`;
  }
  if (req) {
    return `${req.protocol}://${req.get("host")}`;
  }
  return "http://localhost:5000";
}

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.log("[Google Auth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google login disabled");
    app.get("/auth/google", (_req, res) => {
      res.redirect("/account?error=google_not_configured");
    });
    return;
  }

  const callbackURL = `${getBaseUrl()}/auth/google/callback`;
  console.log(`[Google Auth] Callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email provided by Google"));

          const fullName =
            profile.displayName ||
            `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
            email.split("@")[0];

          const customer = await storage.findOrCreateGoogleCustomer(
            profile.id,
            email,
            fullName
          );
          done(null, customer);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  app.use(passport.initialize());

  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/account?error=google_auth_failed",
    }),
    (req: Request & { user?: any }, res: Response) => {
      if (req.user?.id) {
        (req.session as any).customerId = req.user.id;
      }
      res.redirect("/account/profile");
    }
  );
}
