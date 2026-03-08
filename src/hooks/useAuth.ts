import { useState, useEffect } from "react";
import { AuthUser } from "../types";
import { authLogin, authLogout, authSetPassword } from "../lib/auth";
import { getUserRole } from "../lib/supabase";
import { ADMIN_EMAIL } from "../constants";

type AuthState = "loading" | "setpassword" | "login" | "app";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const isAdmin = user?.rol === "admin" || user?.email === ADMIN_EMAIL;

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
    } else {
      setAuthState("login");
    }
  }, []);

  const login = async (email: string, password: string) => {
    const u = await authLogin(email, password);
    setUser(u);
    setAuthState("app");
  };

  const logout = async () => {
    if (user?.token) await authLogout(user.token);
    setUser(null);
    setAuthState("login");
  };

  const setPassword = async (password: string) => {
    await authSetPassword(accessToken, password);
    setAuthState("login");
  };

  return { authState, accessToken, user, isAdmin, login, logout, setPassword };
}