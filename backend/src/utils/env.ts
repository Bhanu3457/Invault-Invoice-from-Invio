import { load } from "dotenv";

let envLoaded = false;

async function loadEnvOnce() {
  if (envLoaded) return;
  try {
    const parsed = await load();
    for (const [key, value] of Object.entries(parsed)) {
      if (Deno.env.get(key) === undefined && value !== undefined) {
        Deno.env.set(key, value);
      }
    }
  } catch (error) {
    // Ignore missing .env files, surface other errors for visibility
    if (!(error instanceof Deno.errors.NotFound)) {
      console.warn("Failed to load .env file:", error);
    }
  }
  envLoaded = true;
}

await loadEnvOnce();

export function getEnv(key: string, fallback?: string): string | undefined {
  const value = Deno.env.get(key);
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function ensureEnv(keys: string[]): void {
  const missing = keys.filter((key) => getEnv(key) === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

export function getAdminCredentials() {
  const username = (getEnv("ADMIN_USER") || "admin").trim();
  const password = (getEnv("ADMIN_PASS") || "admin123").trim();
  return { username, password };
}

export function getJwtSecret(): string {
  const secret = (getEnv("JWT_SECRET") || "default-invio-secret-key-change-in-prod-32chars").trim();
  return secret;
}

export function isDemoMode(): boolean {
  return (getEnv("DEMO_MODE", "false") || "false").toLowerCase() === "true";
}

export function getNumberEnv(key: string, fallback: number): number {
  const raw = getEnv(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
