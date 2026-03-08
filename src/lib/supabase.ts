import { SUPABASE_URL, SUPABASE_KEY } from "../constants";

export async function sbFetch(
  path: string,
  options: RequestInit & { prefer?: string; token?: string } = {},
  token?: string
): Promise<unknown> {
  const authToken = token || SUPABASE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function getUserRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.app_metadata?.rol || null;
  } catch {
    return null;
  }
}