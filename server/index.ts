import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import helmet from "helmet";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
const httpServer = createServer(app);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Allow the delivery dialog's OpenStreetMap preview while keeping all
        // other embedded origins blocked by the default Helmet policy.
        frameSrc: ["'self'", "https://www.openstreetmap.org", "https://accounts.google.com/gsi/"],
        connectSrc: ["'self'", "https://accounts.google.com/gsi/"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://accounts.google.com/gsi/style"],
        scriptSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "https://accounts.google.com/gsi/client",
          ...(process.env.NODE_ENV !== "production" ? ["'unsafe-inline'"] : []),
        ],
      },
    },
  }),
);

const SessionStore = MemoryStore(session);

app.use(
  session({
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
    store: new SessionStore({
      checkPeriod: 86400000,
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET!,
  })
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Customer conversations may contain personal details; never log AI replies.
      if (capturedJsonResponse && !path.startsWith("/api/ysota-ai/")) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: process.env.HOST || "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
