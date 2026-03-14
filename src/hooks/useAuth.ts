import { useState, useEffect, useRef } from "react";
import { AuthUser } from "../types";
import { authLogin, authLogout, authSetPassword, authRefresh } from "../lib/auth";

type AuthState = "loading" | "setpassword" | "login" | "app";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.rol === "admin";

  const scheduleRefresh = (expiresIn: number, refreshToken: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    // Token süresi dolmadan 2 dakika önce yenile
    const delay = Math.max((expiresIn - 120) * 1000, 30_000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const fresh = await authRefresh(refreshToken);
        sessionStorage.setItem("t360_refresh", fresh.refreshToken);
        setUser((prev) => prev ? { ...prev, token: fresh.token } : null);
        scheduleRefresh(fresh.expiresIn, fresh.refreshToken);
      } catch {
        // Refresh başarısız → çıkış
        logout();
      }
    }, delay);
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const token = params.get("access_token") || "";
      const type = params.get("type");
      setAccessToken(token);
      if (type === "invite" || type === "recovery") {
        setAuthState("setpassword");
      } else {
        setAuthState("login");
      }
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    // Sayfa yenilenince sessionStorage'dan refresh token ile oturumu geri al
    const savedRefresh = sessionStorage.getItem("t360_refresh");
    if (savedRefresh) {
      authRefresh(savedRefresh)
        .then((fresh) => {
          sessionStorage.setItem("t360_refresh", fresh.refreshToken);
          // Token'dan kullanıcı bilgisini çıkar
          const payload = JSON.parse(atob(fresh.token.split(".")[1]));
          setUser({
            id: payload.sub,
            email: payload.email,
            token: fresh.token,
            rol: payload.app_metadata?.rol || null,
          });
          scheduleRefresh(fresh.expiresIn, fresh.refreshToken);
          setAuthState("app");
        })
        .catch(() => {
          sessionStorage.removeItem("t360_refresh");
          setAuthState("login");
        });
    } else {
      setAuthState("login");
    }

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authLogin(email, password);
    setUser(u);
    if (u.refreshToken) {
      sessionStorage.setItem("t360_refresh", u.refreshToken);
      scheduleRefresh(u.expiresIn || 3600, u.refreshToken);
    }
    setAuthState("app");
  };

  const logout = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    sessionStorage.removeItem("t360_refresh");
    if (user?.token) authLogout(user.token).catch(() => {});
    setUser(null);
    setAuthState("login");
  };

  const setPassword = async (password: string) => {
    await authSetPassword(accessToken, password);
    setAuthState("login");
  };

  return { authState, accessToken, user, isAdmin, login, logout, setPassword };
}