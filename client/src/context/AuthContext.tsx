import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "@/api/axios";
import { authApi } from "@/api/endpoints";
import type { User, LoginInput, RegisterInput } from "@shared/schemas";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    let cancelled = false;
    if (getToken()) {
      authApi
        .me()
        .then((u) => {
          if (!cancelled) setUser(u);
        })
        .catch(() => {
          clearToken();
          setTokenState(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }
    const onLogout = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener("sbs:logout", onLogout);
    return () => {
      cancelled = true;
      window.removeEventListener("sbs:logout", onLogout);
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await authApi.login(input);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authApi.register(input);
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
