import { env } from "$env/dynamic/private";

export const BACKEND_URL = env.BACKEND_URL || "http://localhost:3000";

export async function getDemoMode() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/demo-mode`, {});
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore backend connectivity issues gracefully
  }
  return { demoMode: false, demoResetMinutes: 0 };
}
