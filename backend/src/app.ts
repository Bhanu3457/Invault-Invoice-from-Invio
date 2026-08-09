import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { initDatabase, resetDatabaseFromDemo } from "./database/init.ts";
import { adminRoutes } from "./routes/admin.ts";
import { publicRoutes } from "./routes/public.ts";
import { authRoutes } from "./routes/auth.ts";
import { logWeasyPrintAvailability } from "./utils/weasyprint.ts";
import { getAdminCredentials, getJwtSecret } from "./utils/env.ts";

const SECURE_HEADERS_DISABLED = (Deno.env.get("SECURE_HEADERS_DISABLED") || "").toLowerCase() === "true";
const HSTS_ENABLED = (Deno.env.get("ENABLE_HSTS") || "").toLowerCase() === "true";
const CONTENT_SECURITY_POLICY = Deno.env.get("CONTENT_SECURITY_POLICY") ||
  "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; connect-src 'self'";

const app = new Hono();

// Health check routes (registered FIRST for instant 200 OK responses to Railway probes)
app.get("/", (c: Context) => c.json({ status: "ok", name: "Invio API" }, 200));
app.get("/health", (c: Context) => c.json({ status: "ok" }, 200));

// Check credentials in environment
const { username: adminUsername, password: adminPassword } = getAdminCredentials();
const secret = getJwtSecret();

// Initialize the database asynchronously so HTTP server opens port 3000 immediately
initDatabase().then(() => {
  console.log("Database initialized successfully");
  logWeasyPrintAvailability();
}).catch((err) => {
  console.error("Database initialization error:", err);
});

// Demo mode scheduler
try {
  const demoMode = (Deno.env.get("DEMO_MODE") || "").toLowerCase() === "true";
  if (demoMode) {
    const hours = Number(Deno.env.get("DEMO_RESET_HOURS") || "3");
    const initial =
      (Deno.env.get("DEMO_RESET_ON_START") || "true").toLowerCase() !== "false";
    if (initial) {
      resetDatabaseFromDemo().catch(console.error);
    }
    const ms = Math.max(1, Math.floor(hours * 60 * 60 * 1000));
    setInterval(async () => {
      try {
        await resetDatabaseFromDemo();
      } catch (e) {
        console.error("Periodic demo reset failed:", e);
      }
    }, ms);
    console.log(`Demo mode: periodic DB reset scheduled every ${hours}h`);
  }
} catch (e) {
  console.warn("Demo reset scheduler could not be started:", e);
}

// Middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    exposeHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", async (c, next) => {
  await next();
  if (SECURE_HEADERS_DISABLED) return;
  const headers = c.res.headers;
  if (!headers.has("X-Content-Type-Options")) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!headers.has("X-Frame-Options")) {
    headers.set("X-Frame-Options", "DENY");
  }
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "no-referrer");
  }
  if (!headers.has("Permissions-Policy")) {
    headers.set("Permissions-Policy", "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()");
  }
  if (!headers.has("Cross-Origin-Opener-Policy")) {
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
  }
  if (!headers.has("Cross-Origin-Resource-Policy")) {
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
  if (!headers.has("Content-Security-Policy")) {
    headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }
  if (HSTS_ENABLED && !headers.has("Strict-Transport-Security")) {
    const proto = c.req.header("x-forwarded-proto")?.toLowerCase() || (c.req.url.startsWith("https://") ? "https" : "http");
    if (proto === "https") {
      headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
  }
});

// Routes
app.route("/api/v1", adminRoutes);
app.route("/api/v1", publicRoutes);
app.route("/api/v1", authRoutes);

// Start the server: allow configuration via BACKEND_PORT or PORT env vars
const rawPort = Deno.env.get("BACKEND_PORT") || Deno.env.get("PORT");
const port = rawPort ? parseInt(rawPort, 10) : 3000;
const listenPort = Number.isFinite(port) && port > 0 ? port : 3000;
console.log(`Starting backend on 0.0.0.0:${listenPort}`);
Deno.serve({ hostname: "0.0.0.0", port: listenPort }, app.fetch);
