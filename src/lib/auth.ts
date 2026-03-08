import { SUPABASE_URL, SUPABASE_KEY } from "../constants";
import { AuthUser } from "../types";

export async function authLogin(
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error_description || data.msg || "Giriş başarısız");
  return {
    id: data.user.id,
    email: data.user.email,
    token: data.access_token,
    rol: data.user.app_metadata?.rol || null,
  };
}

export async function authSetPassword(
  accessToken: string,
  password: string
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.msg || "Şifre belirlenemedi");
  }
}

export async function authLogout(token: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
}