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
    refreshToken: data.refresh_token,   // ← ekle
    expiresIn: data.expires_in,  
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
export async function authRefresh(
  refreshToken: string
): Promise<{ token: string; expiresIn: number; refreshToken: string }> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error("Token yenilenemedi");
  return {
    token: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
// Şifre sıfırlama kodu (OTP) talep et
export async function authRequestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.msg || data.error_description || "Şifre sıfırlama maili gönderilemedi.");
  }
}

// OTP kodunu doğrula ve geçici oturum (token) al
export async function authVerifyOtp(email: string, token: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", email, token }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || data.error_description || "Kod geçersiz veya süresi dolmuş.");
  }
  return data.access_token; // Bu token ile yeni şifre belirlenecek
}